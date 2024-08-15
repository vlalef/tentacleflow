// Cross-browser function for requesting animations
window.requestAnimFrame = function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        return window.setTimeout(callback, 1000 / 60); // 60 FPS fallback
      }
    );
  }();
  
  // Initialization function for the canvas
  function init(elemid) {
    // Get the canvas element and its 2D context
    const canvas = document.getElementById(elemid);
    const c = canvas.getContext("2d");
  
    // Set the canvas width and height to match the window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    // Set the background color of the canvas
    c.fillStyle = "rgba(30,30,30,1)";
    c.fillRect(0, 0, canvas.width, canvas.height);
  
    return { c, canvas };
  }
  
  // Function to calculate the distance between two points
  function dist(p1x, p1y, p2x, p2y) {
    return Math.hypot(p2x - p1x, p2y - p1y);
  }
  
  // Event triggered when the page is fully loaded
  window.onload = function () {
    const { c, canvas } = init("canvas");
  
    // Variables to store mouse position
    let mouse = { x: false, y: false };
    let last_mouse = { x: 0, y: 0 };
  
    // Class representing a segment
    class Segment {
      constructor(parent, length, angle, first) {
        this.first = first;
        this.l = length;
        this.ang = angle;
  
        if (first) {
          this.pos = { x: parent.x, y: parent.y };
        } else {
          this.pos = { x: parent.nextPos.x, y: parent.nextPos.y };
        }
  
        this.nextPos = this.calculateNextPos();
      }
  
      calculateNextPos() {
        return {
          x: this.pos.x + this.l * Math.cos(this.ang),
          y: this.pos.y + this.l * Math.sin(this.ang),
        };
      }
  
      update(target) {
        this.ang = Math.atan2(target.y - this.pos.y, target.x - this.pos.x);
        this.pos.x = target.x + this.l * Math.cos(this.ang - Math.PI);
        this.pos.y = target.y + this.l * Math.sin(this.ang - Math.PI);
        this.nextPos = this.calculateNextPos();
      }
  
      fallback(target) {
        this.pos = { x: target.x, y: target.y };
        this.nextPos = this.calculateNextPos();
      }
  
      show() {
        c.lineTo(this.nextPos.x, this.nextPos.y);
      }
    }
  
    // Class representing a tentacle
    class Tentacle {
      constructor(x, y, length, segmentCount) {
        this.x = x;
        this.y = y;
        this.l = length;
        this.n = segmentCount;
        this.t = {};
        this.rand = Math.random();
        this.segments = [new Segment(this, this.l / this.n, 0, true)];
  
        for (let i = 1; i < this.n; i++) {
          this.segments.push(
            new Segment(this.segments[i - 1], this.l / this.n, 0, false)
          );
        }
      }
  
      move(lastTarget, target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const distance = dist(lastTarget.x, lastTarget.y, target.x, target.y) + 5;
  
        this.t = {
          x: target.x - 0.8 * distance * Math.cos(angle),
          y: target.y - 0.8 * distance * Math.sin(angle),
        };
  
        const updateTarget = this.t.x ? this.t : target;
        this.segments[this.n - 1].update(updateTarget);
  
        for (let i = this.n - 2; i >= 0; i--) {
          this.segments[i].update(this.segments[i + 1].pos);
        }
  
        if (
          dist(this.x, this.y, target.x, target.y) <=
          this.l + dist(lastTarget.x, lastTarget.y, target.x, target.y)
        ) {
          this.segments[0].fallback({ x: this.x, y: this.y });
          for (let i = 1; i < this.n; i++) {
            this.segments[i].fallback(this.segments[i - 1].nextPos);
          }
        }
      }
  
      show(target) {
        if (dist(this.x, this.y, target.x, target.y) <= this.l) {
          c.globalCompositeOperation = "lighter";
          c.beginPath();
          c.moveTo(this.x, this.y);
  
          this.segments.forEach((segment) => segment.show());
  
          c.strokeStyle = `hsl(${this.rand * 60 + 180}, 100%, ${
            this.rand * 60 + 25
          }%)`;
          c.lineWidth = this.rand * 2;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.stroke();
  
          c.globalCompositeOperation = "source-over";
        }
      }
  
      show2(target) {
        c.beginPath();
  
        const distance = dist(this.x, this.y, target.x, target.y);
        const arcRadius = distance <= this.l ? 2 * this.rand + 1 : this.rand * 2;
  
        c.arc(this.x, this.y, arcRadius, 0, 2 * Math.PI);
        c.fillStyle = distance <= this.l ? "white" : "darkcyan";
        c.fill();
      }
    }
  
    const maxl = 300;
    const minl = 50;
    const n = 30;
    const numt = 500;
    const tent = [];
    let target = { x: canvas.width / 2, y: canvas.height / 2 };
    let last_target = { ...target };
    let t = 0;
    const q = 10;
  
    for (let i = 0; i < numt; i++) {
      tent.push(
        new Tentacle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * (maxl - minl) + minl,
          n
        )
      );
    }
  
    function draw() {
      if (mouse.x) {
        target.errx = mouse.x - target.x;
        target.erry = mouse.y - target.y;
      } else {
        target.errx =
          canvas.width / 2 +
          ((canvas.height / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
            (Math.pow(Math.sin(t), 2) + 1) -
          target.x;
        target.erry =
          canvas.height / 2 +
          ((canvas.height / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
            (Math.pow(Math.sin(t), 2) + 1) -
          target.y;
      }
  
      target.x += target.errx / 10;
      target.y += target.erry / 10;
  
      t += 0.01;
  
      c.beginPath();
      c.arc(
        target.x,
        target.y,
        dist(last_target.x, last_target.y, target.x, target.y) + 5,
        0,
        2 * Math.PI
      );
      c.fillStyle = "hsl(210,100%,80%)";
      c.fill();
  
      tent.forEach((t) => {
        t.move(last_target, target);
        t.show2(target);
      });
      tent.forEach((t) => t.show(target));
  
      last_target = { ...target };
    }
  
    canvas.addEventListener("mousemove", (e) => {
      last_mouse.x = mouse.x;
      last_mouse.y = mouse.y;
      mouse.x = e.pageX - canvas.offsetLeft;
      mouse.y = e.pageY - canvas.offsetTop;
    });
  
    canvas.addEventListener("mouseleave", () => {
      mouse = { x: false, y: false };
    });
  
    canvas.addEventListener("mousedown", () => (mouse.clicked = true));
    canvas.addEventListener("mouseup", () => (mouse.clicked = false));
  
    function loop() {
      c.clearRect(0, 0, canvas.width, canvas.height);
      draw();
      requestAnimFrame(loop);
    }
  
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      loop();
    });
  
    loop();
  };