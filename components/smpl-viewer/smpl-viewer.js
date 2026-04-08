const { createScopedThreejs } = require('../../libs/three/three.js');

Component({
  properties: {
    text: {
      type: String,
      value: ''
    },
    videoUrl: {
      type: String,
      value: ''  // 后端返回的视频URL
    },
    taskId: {
      type: String,
      value: ''  // 生成任务ID
    },
    smplBase: {
      type: String,
      value: ''  // SMPL服务基础URL
    },
    endpoints: {
      type: Object,
      value: {}  // API端点配置
    }
  },
  data: {
    loading: true,
    error: '',
    startY: 0,
    translateY: 0,
    pulling: false,
    playbackRate: 1,
    isPlaying: false,
    // 生成状态
    isGenerating: false,
    progress: 0,
    statusText: '正在为您生成中...'
  },
  lifetimes: {
    attached() {
      this.setData({ loading: true, error: '' });
    },
    ready() {
      // 如果有taskId且有有效的smplBase和endpoints，开始轮询生成进度
      const { taskId, smplBase, endpoints, videoUrl } = this.properties;
      if (taskId && smplBase && endpoints && endpoints.SMPL_STATUS) {
        this.setData({ isGenerating: true });
        this.pollTaskStatus(taskId);
      } else if (videoUrl) {
        // 已有videoUrl，直接显示
        setTimeout(() => {
          this.setData({ loading: false, isGenerating: false });
          wx.vibrateShort({ type: 'light' });
        }, 500);
      } else {
        // 没有taskId也没有videoUrl，显示3D模式
        setTimeout(() => {
          this.setData({ loading: false });
        }, 1500);
      }
    },
    detached() {
      this.cleanup();
      this.cleanupGeneration();
    }
  },
  observers: {
    'videoUrl': function(url) {
      if (url) {
        this.setData({
          loading: false,
          error: '',
          isGenerating: false,
          progress: 100
        });
        // 视频加载完成后播放
        this.videoContext = wx.createVideoContext('smplVideo', this);
        wx.vibrateShort({ type: 'light' });
      }
    }
  },
  methods: {
    cleanup() {
      if (this._renderLoop) {
        cancelAnimationFrame(this._renderLoop);
        this._renderLoop = null;
      }
      if (this._renderer) {
        this._renderer.dispose && this._renderer.dispose();
        this._renderer = null;
      }
      if (this.videoContext) {
        this.videoContext.stop();
        this.videoContext = null;
      }
    },

    // 获取任务进度
    fetchTaskProgress(taskId) {
      const { smplBase, endpoints } = this.properties;
      if (!smplBase || !endpoints.SMPL_PROGRESS) {
        return Promise.resolve(0);
      }
      return new Promise((resolve) => {
        wx.request({
          url: `${smplBase}${endpoints.SMPL_PROGRESS}/${taskId}`,
          method: 'GET',
          success: (res) => {
            if (res.statusCode === 200 && res.data) {
              resolve(res.data.progress || 0);
            } else {
              resolve(0);
            }
          },
          fail: () => resolve(0)
        });
      });
    },

    // 轮询任务状态
    async pollTaskStatus(taskId) {
      const { smplBase, endpoints } = this.properties;
      console.log('[SMPL] 开始轮询任务:', taskId, 'base:', smplBase);

      if (!smplBase || !endpoints.SMPL_STATUS) {
        console.error('[SMPL] 配置错误:', { smplBase, endpoints });
        this.setData({ error: '配置错误', loading: false });
        return;
      }

      let pollCount = 0;
      const maxPolls = 600; // 最多轮询600次（约10分钟）

      // 定期获取进度
      this._progressTimer = setInterval(async () => {
        const progress = await this.fetchTaskProgress(taskId);
        console.log('[SMPL] 进度:', progress + '%');
        this.setData({
          progress: progress,
          statusText: `正在为您生成中，已生成 ${progress}%`
        });
      }, 1000); // 每1秒获取一次进度

      const doPoll = () => {
        console.log('[SMPL] 轮询次数:', pollCount, '/', maxPolls);

        if (pollCount >= maxPolls) {
          console.log('[SMPL] 超时');
          clearInterval(this._progressTimer);
          this.setData({
            error: '生成超时（超过10分钟）',
            loading: false,
            isGenerating: false
          });
          return;
        }

        wx.request({
          url: `${smplBase}${endpoints.SMPL_STATUS}/${taskId}`,
          method: 'GET',
          success: (res) => {
            console.log('[SMPL] 状态响应:', res.statusCode, res.data);

            if (res.statusCode === 200 && res.data) {
              const status = res.data.status || res.data.state || res.data.task_status;
              console.log('[SMPL] 当前状态:', status, '完整响应:', res.data);

              if (status === 'completed') {
                console.log('[SMPL] 任务完成！');
                clearInterval(this._progressTimer);
                // 任务完成，获取视频URL
                const videoUrl = `${smplBase}${endpoints.SMPL_VIDEO}/${taskId}`;
                this.setData({
                  videoUrl: videoUrl,
                  loading: false,
                  isGenerating: false,
                  progress: 100,
                  statusText: '生成完成！'
                });
                // 通知父组件
                this.triggerEvent('complete', { videoUrl, text: this.properties.text });
                wx.vibrateShort({ type: 'light' });
              } else if (status === 'failed') {
                console.error('[SMPL] 任务失败:', res.data.error);
                clearInterval(this._progressTimer);
                this.setData({
                  error: '生成失败: ' + (res.data.error || ''),
                  loading: false,
                  isGenerating: false
                });
              } else {
                // 仍在处理中（queued 或 processing），继续轮询
                console.log('[SMPL] 继续轮询...');
                pollCount++;
                this._pollTimer = setTimeout(doPoll, 1000);
              }
            } else {
              console.error('[SMPL] 响应错误:', res);
              pollCount++;
              this._pollTimer = setTimeout(doPoll, 1000);
            }
          },
          fail: (err) => {
            console.error('[SMPL] 请求失败:', err);
            pollCount++;
            this._pollTimer = setTimeout(doPoll, 1000);
          }
        });
      };

      doPoll();
    },

    onCanvasReady() {
      // 只有在没有视频URL且不在生成中时才初始化Three.js
      if (!this.properties.videoUrl && !this.data.isGenerating) {
        this.initThree();
      }
    },

    initThree() {
      const query = wx.createSelectorQuery().in(this);
      query.select('#webgl').node().exec((res) => {
        if (!res[0] || !res[0].node) {
          console.warn('canvas node not found');
          this.setData({ loading: false, error: 'Canvas初始化失败' });
          wx.showToast({ title: '初始化失败，请重试', icon: 'none' });
          return;
        }
        const canvas = res[0].node;
        let THREE;
        try {
          THREE = createScopedThreejs(canvas);
        } catch (e) {
          console.error('createScopedThreejs failed', e);
          this.setData({ loading: false, error: '3D渲染初始化失败，请重试' });
          wx.showToast({ title: '3D渲染初始化失败', icon: 'none' });
          return;
        }
        this._THREE = THREE;

        const sysInfo = wx.getWindowInfo();
        const width = sysInfo.windowWidth;
        const height = sysInfo.windowHeight;
        const pixelRatio = sysInfo.pixelRatio || 1;
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
        renderer.setClearColor(0xF8FAFF, 1);
        this._renderer = renderer;

        // Scene
        const scene = new THREE.Scene();
        this._scene = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.6, 4.2);
        camera.lookAt(0, 0.8, 0);
        this._camera = camera;

        // Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(3, 5, 3);
        scene.add(dirLight);

        // Floor reflection circle (very subtle)
        const planeGeo = new THREE.CircleGeometry(1.2, 64);
        const planeMat = new THREE.MeshBasicMaterial({ color: 0xE3F2FD, transparent: true, opacity: 0.35 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0;
        scene.add(plane);

        // Build a simplified humanoid figure
        this._figure = this.createFigure(THREE, scene);

        // Animation loop
        const animate = () => {
          this._renderLoop = canvas.requestAnimationFrame(animate);
          const time = Date.now() * 0.001;
          this.animateFigure(this._figure, time);
          renderer.render(scene, camera);
        };
        animate();
      });
    },

    createFigure(THREE, scene) {
      const material = new THREE.MeshLambertMaterial({ color: 0x90A4AE });
      const group = new THREE.Group();

      // Head
      const headGeo = new THREE.SphereGeometry(0.18, 32, 32);
      const head = new THREE.Mesh(headGeo, material);
      head.position.y = 1.68;
      group.add(head);

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.65, 32);
      const torso = new THREE.Mesh(torsoGeo, material);
      torso.position.y = 1.25;
      group.add(torso);

      // Arms
      const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.55, 16);
      const leftArm = new THREE.Mesh(armGeo, material);
      leftArm.position.set(-0.35, 1.35, 0);
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, material);
      rightArm.position.set(0.35, 1.35, 0);
      group.add(rightArm);

      // Forearms
      const forearmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.5, 16);
      const leftForearm = new THREE.Mesh(forearmGeo, material);
      leftForearm.position.set(-0.5, 0.85, 0.1);
      leftForearm.rotation.x = 0.3;
      group.add(leftForearm);

      const rightForearm = new THREE.Mesh(forearmGeo, material);
      rightForearm.position.set(0.5, 0.85, 0.1);
      rightForearm.rotation.x = 0.3;
      group.add(rightForearm);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.8, 16);
      const leftLeg = new THREE.Mesh(legGeo, material);
      leftLeg.position.set(-0.12, 0.4, 0);
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, material);
      rightLeg.position.set(0.12, 0.4, 0);
      group.add(rightLeg);

      scene.add(group);
      return group;
    },

    animateFigure(figure, time) {
      if (!figure) return;
      figure.rotation.y = Math.sin(time * 0.5) * 0.15;
      figure.position.y = Math.sin(time * 1.2) * 0.015;
    },

    // 视频播放相关方法
    onVideoPlay() {
      this.setData({ isPlaying: true });
      console.log('视频开始播放');
    },

    onVideoPause() {
      this.setData({ isPlaying: false });
      console.log('视频暂停');
    },

    onVideoEnded() {
      this.setData({ isPlaying: false });
      console.log('视频播放结束');
    },

    onVideoError(e) {
      console.error('视频播放错误:', e.detail);
      this.setData({
        error: '视频播放失败',
        isPlaying: false
      });
    },

    onTouchStart(e) {
      this.setData({ startY: e.touches[0].clientY, pulling: true });
    },
    onTouchMove(e) {
      const dy = e.touches[0].clientY - this.data.startY;
      if (dy > 0) {
        this.setData({ translateY: dy });
      }
    },
    onTouchEnd() {
      const threshold = wx.getWindowInfo().windowHeight / 5;
      if (this.data.translateY > threshold) {
        this.closeViewer();
      } else {
        this.setData({ translateY: 0, pulling: false });
      }
    },
    closeViewer() {
      this.setData({ translateY: wx.getWindowInfo().windowHeight, pulling: false });
      if (this.videoContext) {
        this.videoContext.stop();
      }
      setTimeout(() => {
        this.triggerEvent('close');
      }, 250);
    },

    // 取消生成
    cancelGeneration() {
      wx.showModal({
        title: '取消生成',
        content: '确定要取消手语动画生成吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            console.log('[SMPL] 用户取消生成');
            this.cleanupGeneration();
            // 通知父组件生成被取消
            this.triggerEvent('cancel', { text: this.properties.text });
            this.closeViewer();
          }
        }
      });
    },

    // 清理生成相关资源
    cleanupGeneration() {
      // 清除轮询定时器
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
      if (this._progressTimer) {
        clearInterval(this._progressTimer);
        this._progressTimer = null;
      }
      // 重置生成状态
      this.setData({
        isGenerating: false,
        progress: 0,
        statusText: '正在为您生成中...'
      });
    },
    replay() {
      if (this.data.videoUrl && this.videoContext) {
        this.videoContext.seek(0);
        this.videoContext.play();
      } else {
        if (this._camera) {
          this._camera.position.set(0, 1.6, 4.2);
          this._camera.lookAt(0, 0.8, 0);
        }
      }
    },
    changeSpeed() {
      const rates = [0.5, 0.75, 1, 1.25, 1.5];
      const currentIndex = rates.indexOf(this.data.playbackRate);
      const nextIndex = (currentIndex + 1) % rates.length;
      const newRate = rates[nextIndex];

      this.setData({ playbackRate: newRate });

      if (this.data.videoUrl && this.videoContext) {
        this.videoContext.playbackRate(newRate);
      }

      wx.showToast({
        title: `播放速度: ${newRate}x`,
        icon: 'none',
        duration: 1000
      });
    },
    share() {
      if (this.data.videoUrl) {
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
        });
        wx.showToast({ title: '请点击右上角分享', icon: 'none' });
      } else {
        wx.showToast({ title: '分享功能开发中', icon: 'none' });
      }
    }
  }
});
