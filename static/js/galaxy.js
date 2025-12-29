document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let glycans = [];
  let stars = [];
  let mouse = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };
  let currentRotation = { x: 0, y: 0 };

  // Configuration
  const GLYCAN_COUNT = 40;
  const STAR_COUNT = 150;
  const COLORS = ['#5eead4', '#a855f7', '#3b82f6', '#f472b6']; // Theme colors: Cyan, Purple, Blue, Pink

  // Resize
  function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight; // Full viewport
      // If canvas is not fixed, this might need adjustment, but for hero background it's fine.
  }
  window.addEventListener('resize', resize);
  resize();

  // Mouse Move
  window.addEventListener('mousemove', (e) => {
      // Normalize mouse position -1 to 1
      mouse.x = (e.clientX / width) * 2 - 1;
      mouse.y = (e.clientY / height) * 2 - 1;
  });

  // -------------------------------------------------------------
  // CLASSES
  // -------------------------------------------------------------

  class Star {
      constructor() {
          this.reset();
          this.z = Math.random() * 2000; // Place randomly in depth initially
      }

      reset() {
          this.x = (Math.random() - 0.5) * width * 3;
          this.y = (Math.random() - 0.5) * height * 3;
          this.z = 2000; // Reset to far back
          this.size = Math.random() * 1.5;
          this.opacity = Math.random();
      }

      update(speed) {
          this.z -= speed;
          if (this.z <= 0) this.reset();
      }

      draw() {
          const perspective = 300 / (300 + this.z);
          const sx = width / 2 + this.x * perspective;
          const sy = height / 2 + this.y * perspective;
          const sSize = this.size * perspective * 2;

          if (sx > 0 && sx < width && sy > 0 && sy < height) {
              ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
              ctx.beginPath();
              ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
              ctx.fill();
          }
      }
  }

  class GlycanNode {
      constructor(depth = 0) {
          this.shape = Math.random() > 0.5 ? 'circle' : 'square'; // Symbol
          this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          this.children = [];
          
          // Procedural generation: simpler as we go deeper
          if (depth < 3 && Math.random() > (0.2 * depth)) {
              const childCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 branches
              for(let i=0; i<childCount; i++) {
                  this.children.push(new GlycanNode(depth + 1));
              }
          }
      }
  }

  class Glycan {
      constructor() {
          // Galaxy spiral position
          this.angle = Math.random() * Math.PI * 2;
          this.distance = 150 + Math.random() * 400; // Radius from center
          this.speed = (0.002 + Math.random() * 0.005) * (this.distance > 250 ? 0.7 : 1.2); // Inner faster
          this.yOffset = (Math.random() - 0.5) * 150; // Vertical scatter
          
          // Structure
          this.root = new GlycanNode();
          this.sizeScale = 0.5 + Math.random() * 0.5;
          
          // 3D coordinates (derived in update)
          this.x = 0;
          this.y = 0;
          this.z = 0;
      }

      update() {
          this.angle += this.speed;
          
          // 3D Position in Galaxy coordinates
          const x3d = Math.cos(this.angle) * this.distance;
          const z3d = Math.sin(this.angle) * this.distance;
          const y3d = this.yOffset;

          // Apply Rotation based on Mouse (Tilt)
          // Rotate around X axis
          const rotX = currentRotation.y * 0.5; // Mouse Y controls Tilt
          const rotY = currentRotation.x * 0.5; // Mouse X controls Pan

          // Simple 3D rotation matrix logic
          let y2 = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
          let z2 = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);
          
          let x2 = x3d * Math.cos(rotY) - z2 * Math.sin(rotY);
          let z3 = x3d * Math.sin(rotY) + z2 * Math.cos(rotY);

          this.x = x2;
          this.y = y2;
          this.z = z3;
      }

      draw() {
          // Project 3D to 2D
          // Center the galaxy on the right side of screen (75% width) to balance text
          // On mobile (width < 768), center it (50%)
          const isMobile = width < 768;
          const cx = isMobile ? width * 0.5 : width * 0.75; 
          const cy = height * 0.5;
          
          const fov = 400;
          const scale = fov / (fov + this.z);

          const screenX = cx + this.x * scale;
          const screenY = cy + this.y * scale;

          // Draw if valid size
          if (scale > 0 && screenX > -50 && screenX < width + 50 && screenY > -50 && screenY < height + 50) {
              // Draw connections and nodes recursively
              this.drawNode(this.root, screenX, screenY, -Math.PI/2, 20 * this.sizeScale * scale, scale);
          }
      }

      drawNode(node, x, y, angle, length, scale) {
          const size = 6 * this.sizeScale * scale;
          const branchAngle = Math.PI / 4; // 45 degrees
          const childCount = node.children.length;

          // Draw connections and children FIRST
          node.children.forEach((child, index) => {
              // Calculate branch direction
              let currentAngle = angle;
              if (childCount > 1) {
                   // Spread branches
                   currentAngle = angle + (index === 0 ? -branchAngle : branchAngle);
              }
              
              const nx = x + Math.cos(currentAngle) * length;
              const ny = y + Math.sin(currentAngle) * length;

              // Line - Reset context for line drawing
              ctx.lineWidth = 2 * scale;
              ctx.strokeStyle = node.color; 
              ctx.shadowBlur = 0; 
              
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(nx, ny);
              ctx.stroke();

              // Recursive call
              this.drawNode(child, nx, ny, currentAngle, length * 0.8, scale);
          });

          // Draw current node LAST
          ctx.fillStyle = node.color;
          
          // Glow
          ctx.shadowBlur = 10 * scale;
          ctx.shadowColor = node.color;

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
      stars = [];
      for (let i = 0; i < GLYCAN_COUNT; i++) {
          glycans.push(new Glycan());
      }
      for (let i = 0; i < STAR_COUNT; i++) {
          stars.push(new Star());
      }
  }
  init();

  function animate() {
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Smooth rotation based on mouse
      targetRotation.x = mouse.x;
      targetRotation.y = mouse.y;
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05;

      // Draw Stars
      stars.forEach(star => {
          star.update(2); // Speed
          star.draw();
      });

      // Draw center glow (Galaxy Core)
      const isMobile = width < 768;
      const cx = isMobile ? width * 0.5 : width * 0.75;  
      const cy = height * 0.5;
      
      const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
      radial.addColorStop(0, 'rgba(168, 85, 247, 0.15)'); // Purple core
      radial.addColorStop(0.5, 'rgba(94, 234, 212, 0.05)'); // Cyan outer
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      
      // We want to add this glow without wiping the previous frame's clearRect fully if we wanted trails,
      // but here we just draw it on top of cleared canvas
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Draw Glycans (sort by Z for depth buffering basic)
      glycans.sort((a, b) => a.z - b.z); // Draw far ones first
      glycans.forEach(g => {
          g.update();
          g.draw();
      });

      requestAnimationFrame(animate);
  }
  animate();

});
