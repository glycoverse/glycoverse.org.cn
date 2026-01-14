document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let width, height;
  let glycans = [];
  let mouse = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };
  let currentRotation = { x: 0, y: 0 };

  // Configuration - optimized
  const GLYCAN_COUNT = 20;
  const COLORS = ['#5eead4', '#a855f7', '#3b82f6', '#f472b6'];

  // Resize
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Create frosted glass overlay for text readability
  function createOverlay() {
    if (document.getElementById('galaxy-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'galaxy-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '60%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '1';
    overlay.style.pointerEvents = 'none';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    const mask = 'linear-gradient(to right, black 0%, black 40%, transparent 100%)';
    overlay.style.maskImage = mask;
    overlay.style.webkitMaskImage = mask;

    if (canvas.parentNode) {
      canvas.parentNode.insertBefore(overlay, canvas.nextSibling);
    }
  }
  createOverlay();

  // Mouse Move
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = (e.clientY / height) * 2 - 1;
  });

  // -------------------------------------------------------------
  // CLASSES
  // -------------------------------------------------------------

  class GlycanNode {
    constructor(depth = 0) {
      this.shape = Math.random() > 0.5 ? 'circle' : 'square';
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.children = [];

      if (depth < 3 && Math.random() > (0.2 * depth)) {
        const childCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < childCount; i++) {
          this.children.push(new GlycanNode(depth + 1));
        }
      }
    }
  }

  class Glycan {
    constructor() {
      this.angle = Math.random() * Math.PI * 2;
      this.distance = 150 + Math.random() * 400;
      this.speed = (0.002 + Math.random() * 0.005) * (this.distance > 250 ? 0.7 : 1.2);
      this.yOffset = (Math.random() - 0.5) * 150;
      this.root = new GlycanNode();
      this.sizeScale = 0.5 + Math.random() * 0.5;
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    update() {
      this.angle += this.speed;

      const x3d = Math.cos(this.angle) * this.distance;
      const z3d = Math.sin(this.angle) * this.distance;
      const y3d = this.yOffset;

      const rotX = currentRotation.y * 0.5;
      const rotY = currentRotation.x * 0.5;

      let y2 = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
      let z2 = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

      let x2 = x3d * Math.cos(rotY) - z2 * Math.sin(rotY);
      let z3 = x3d * Math.sin(rotY) + z2 * Math.cos(rotY);

      this.x = x2;
      this.y = y2;
      this.z = z3;
    }

    draw() {
      const isMobile = width < 768;
      const cx = isMobile ? width * 0.5 : width * 0.75;
      const cy = height * 0.5;

      const fov = 400;
      const scale = fov / (fov + this.z);

      const screenX = cx + this.x * scale;
      const screenY = cy + this.y * scale;

      if (scale > 0 && screenX > -100 && screenX < width + 100 && screenY > -100 && screenY < height + 100) {
        this.drawNode(this.root, screenX, screenY, -Math.PI / 2, 20 * this.sizeScale * scale, scale);
      }
    }

    drawNode(node, x, y, angle, length, scale) {
      const size = 6 * this.sizeScale * scale;
      const branchAngle = Math.PI / 4;
      const childCount = node.children.length;

      // Pre-calculate line style
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.strokeStyle = node.color;

      // Draw children first
      node.children.forEach((child, index) => {
        let currentAngle = angle;
        if (childCount > 1) {
          currentAngle = angle + (index === 0 ? -branchAngle : branchAngle);
        }

        const nx = x + Math.cos(currentAngle) * length;
        const ny = y + Math.sin(currentAngle) * length;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        this.drawNode(child, nx, ny, currentAngle, length * 0.8, scale);
      });

      // Draw current node
      ctx.fillStyle = node.color;

      if (node.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      }
    }
  }

  // -------------------------------------------------------------
  // INIT & LOOP
  // -------------------------------------------------------------

  function init() {
    glycans = [];
    for (let i = 0; i < GLYCAN_COUNT; i++) {
      glycans.push(new Glycan());
    }
  }
  init();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Smooth rotation based on mouse
    targetRotation.x = mouse.x;
    targetRotation.y = mouse.y;
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

    // Draw center glow (Galaxy Core)
    const isMobile = width < 768;
    const cx = isMobile ? width * 0.5 : width * 0.75;
    const cy = height * 0.5;

    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    radial.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
    radial.addColorStop(0.5, 'rgba(94, 234, 212, 0.04)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Update positions
    glycans.forEach(g => g.update());

    // Sort by Z for depth
    glycans.sort((a, b) => b.z - a.z);

    glycans.forEach(g => g.draw());

    requestAnimationFrame(animate);
  }
  animate();
});
