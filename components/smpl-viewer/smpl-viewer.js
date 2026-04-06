const { createScopedThreejs } = require('../../libs/three/three.js');

Component({
  properties: {
    text: {
      type: String,
      value: ''
    }
  },
  data: {
    loading: true,
    startY: 0,
    translateY: 0,
    pulling: false
  },
  lifetimes: {
    attached() {
      this.setData({ loading: true });
    },
    ready() {
      setTimeout(() => {
        this.setData({ loading: false });
        wx.vibrateShort({ type: 'light' });
      }, 1500);
    },
    detached() {
      if (this._renderLoop) {
        cancelAnimationFrame(this._renderLoop);
        this._renderLoop = null;
      }
      if (this._renderer) {
        this._renderer.dispose && this._renderer.dispose();
      }
    }
  },
  methods: {
    onCanvasReady() {
      this.initThree();
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
      // subtle sway
      figure.position.y = Math.sin(time * 1.2) * 0.015;
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
      setTimeout(() => {
        this.triggerEvent('close');
      }, 250);
    },
    replay() {
      // Replay placeholder: smooth camera reset
      if (this._camera) {
        this._camera.position.set(0, 1.6, 4.2);
        this._camera.lookAt(0, 0.8, 0);
      }
    },
    changeSpeed() {
      wx.showToast({ title: '倍速播放功能开发中', icon: 'none' });
    },
    share() {
      wx.showToast({ title: '分享功能开发中', icon: 'none' });
    }
  }
});
