var App = {};

jQuery(document).ready(function() {
  // Setup canvas and app
  App.setup();
  // Launch animation loop
  App.frame = function() {
    App.update();
    window.requestAnimationFrame(App.frame);
  };
	App.frame();
  
  // Убираем отступы
  jQuery('body').css('margin', '0');
  jQuery('html').css('overflow', 'hidden');
	
	jQuery('canvas#ourCanvas').on('click', function(event) {
    App.hasUserClicked = !App.hasUserClicked;
  });
  
  jQuery('canvas#ourCanvas').on('mousemove', function(event) {
    App.target.x = event.pageX;
    App.target.y = event.pageY;
  });
});

App.setup = function() {
  // Setup canvas and get canvas context
  var canvas = document.createElement('canvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.id = 'ourCanvas';
  document.body.appendChild(canvas);
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  
  // Define a few useful elements
  this.stepCount = 0;
  this.hasUserClicked = false;
  this.xC = canvas.width / 2;
  this.yC = canvas.height / 2;
  this.target = {
    x: this.xC,
    y: this.yC,
    radius: 20
  };
  this.armsPop = 20;
  this.particlesPerArm = 15;
  
  // Create initial targets and arms
  this.arms = [];
  for (var i = 0; i < this.armsPop; i++) {
    this.arms.push([]);
  }
  // Fill initial arms
  this.initialBirth();
  
  // Some forces
  this.gravity = -1;
  this.springStiffness = 0.5;
  this.viscosity = 0.1;
  this.isElastic = false;
};
App.initialBirth = function() {
  for (var armIndex = 0; armIndex < this.arms.length; armIndex++) {
    var arm = this.arms[armIndex];
    var particlesNb = 20 + Math.ceil(20 * Math.random());
    for (var i = 0; i < particlesNb; i++) {
      var x = this.width * Math.random();
      var y = this.height * Math.random();
      var particle = {
        x: x,
        y: y,
        xLast: x,
        yLast: y,
        xSpeed: 0,
        ySpeed: 0,
        stickLength: 10,
        name: 'seed' + this.stepCount
      };

      arm.push(particle);
    }
  }
  
};
App.update = function() {
  // Evolve system
  this.evolve();
  // Move particles
  this.move();
  // Draw particles
  this.draw();
};
App.evolve = function() {
  this.stepCount++;
  this.target.radius = 50 + 30 * Math.sin(this.stepCount / 10);
};
App.move = function() {
  // This is inverse kinematics, the particles form an arm with N joints, and its shape adapts with a target contraint
  // Move target point
  if (!this.hasUserClicked) {
    this.target.x = this.xC + 150 * Math.cos(this.stepCount / 50);
    this.target.y = this.yC + 150 * Math.sin(this.stepCount / 20);
  }
  
  // Move particles accordingly on (each arm)
  for (var armIndex = 0; armIndex < this.arms.length; armIndex++) {
    var arm = this.arms[armIndex];
    var ownTargetAngle = 2 * Math.PI * armIndex / this.arms.length;
    var ownTarget = {
      x: this.target.x + this.target.radius * Math.cos(ownTargetAngle),
      y: this.target.y + this.target.radius * Math.sin(ownTargetAngle),
    }
    for (var i = 0; i < arm.length; i++) {
      var p = arm[i];
      var pLead = ( i == 0 ? ownTarget : arm[i-1] );
      var angle = segmentAngleRad(p.x, p.y, pLead.x, pLead.y, false);
      var dist = Math.sqrt(Math.pow(p.x - pLead.x, 2) + Math.pow(p.y - pLead.y, 2));
      var translationDist = dist - p.stickLength;
      if (translationDist < 0) {
        angle += Math.PI;
        translationDist = Math.abs(translationDist);
      }
      /* Kinetic binding */
      var dx = translationDist * Math.cos(angle);
      var dy = translationDist * Math.sin(angle);
      if (!this.isElastic) {
        p.x += dx;
        p.y -= dy;
      }
      /* Forces */
      var xAcc = this.springStiffness * dx - this.viscosity * p.xSpeed;
      var yAcc = this.springStiffness * dy + this.gravity - this.viscosity * p.ySpeed;
      p.xSpeed += xAcc;
      p.ySpeed += yAcc;
      p.x += 0.1 * p.xSpeed;
      p.y -= 0.1 * p.ySpeed;
    }
  }
  
}
App.draw = function() {
  // Add transparent layer for trace effect
  this.ctx.beginPath();
  this.ctx.rect(0, 0, this.width, this.height);
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  this.ctx.fill();
  
  // Draw target
  this.ctx.beginPath();
    this.ctx.arc(this.target.x, this.target.y, 15, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fill();
  
  // Draw particles
  for (var armIndex = 0; armIndex < this.arms.length; armIndex++) {
    var arm = this.arms[armIndex];
    for (var i = 0; i < arm.length; i++) {
      var particle = arm[i];
      if (i != 0) { var particleLead = arm[i-1]; }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 0.3 * (arm.length - i), 0, 2 * Math.PI, false);
      this.ctx.strokeStyle = 'hsla(' + (200 + i * 4) + ', 90%, 50%, 0.7)';
      this.ctx.stroke();
      // Draw its stick
      this.ctx.beginPath();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = 'hsla(' + (180 + i * 4) + ', 80%, 50%, 0.7)';
      if (i == 0) this.ctx.moveTo(this.target.x, this.target.y);
      else this.ctx.moveTo(particleLead.x, particleLead.y);
      this.ctx.lineTo(particle.x, particle.y);
      this.ctx.stroke();

    }
  }
};



/**
 * @param {Number} Xstart X value of the segment starting point
 * @param {Number} Ystart Y value of the segment starting point
 * @param {Number} Xtarget X value of the segment target point
 * @param {Number} Ytarget Y value of the segment target point
 * @param {Boolean} realOrWeb true if Real (Y towards top), false if Web (Y towards bottom)
 * @returns {Number} Angle between 0 and 2PI
 */
segmentAngleRad = function(Xstart, Ystart, Xtarget, Ytarget, realOrWeb) {
	var result;// Will range between 0 and 2PI
	if (Xstart == Xtarget) {
		if(Ystart == Ytarget) {
			result = 0; 
		} else if (Ystart < Ytarget) {
			result = Math.PI/2;
		} else if (Ystart > Ytarget) {
			result = 3*Math.PI/2;
		} else {}
	} else if (Xstart < Xtarget) {
		result = Math.atan((Ytarget - Ystart)/(Xtarget - Xstart));
	} else if (Xstart > Xtarget) {
		result = Math.PI + Math.atan((Ytarget - Ystart)/(Xtarget - Xstart));
	}
	
	result = (result + 2*Math.PI)%(2*Math.PI);
	
	if (!realOrWeb) {
		result = 2*Math.PI - result;
	}
	
	return result;
}


	
/* I use the amazing Victor.js library */
/*!
MIT License
Copyright (c) 2011 Max Kueng, George Crabtree
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
!function(t){if("object"==typeof exports)module.exports=t();else if("function"==typeof define&&define.amd)define(t);else{var i;"undefined"!=typeof window?i=window:"undefined"!=typeof global?i=global:"undefined"!=typeof self&&(i=self),i.Victor=t()}}(function(){return function t(i,r,n){function o(s,h){if(!r[s]){if(!i[s]){var u="function"==typeof require&&require;if(!h&&u)return u(s,!0);if(e)return e(s,!0);throw new Error("Cannot find module '"+s+"'")}var p=r[s]={exports:{}};i[s][0].call(p.exports,function(t){var r=i[s][1][t];return o(r?r:t)},p,p.exports,t,i,r,n)}return r[s].exports}for(var e="function"==typeof require&&require,s=0;s<n.length;s++)o(n[s]);return o}({1:[function(t,i,r){function n(t,i){return this instanceof n?(this.x=t||0,void(this.y=i||0)):new n(t,i)}function o(t,i){return Math.floor(Math.random()*(i-t+1)+t)}function e(t){return t*h}function s(t){return t/h}r=i.exports=n,n.fromArray=function(t){return new n(t[0]||0,t[1]||0)},n.fromObject=function(t){return new n(t.x||0,t.y||0)},n.prototype.addX=function(t){return this.x+=t.x,this},n.prototype.addY=function(t){return this.y+=t.y,this},n.prototype.add=function(t){return this.x+=t.x,this.y+=t.y,this},n.prototype.addScalar=function(t){return this.x+=t,this.y+=t,this},n.prototype.addScalarX=function(t){return this.x+=t,this},n.prototype.addScalarY=function(t){return this.y+=t,this},n.prototype.subtractX=function(t){return this.x-=t.x,this},n.prototype.subtractY=function(t){return this.y-=t.y,this},n.prototype.subtract=function(t){return this.x-=t.x,this.y-=t.y,this},n.prototype.subtractScalar=function(t){return this.x-=t,this.y-=t,this},n.prototype.subtractScalarX=function(t){return this.x-=t,this},n.prototype.subtractScalarY=function(t){return this.y-=t,this},n.prototype.divideX=function(t){return this.x/=t.x,this},n.prototype.divideY=function(t){return this.y/=t.y,this},n.prototype.divide=function(t){return this.x/=t.x,this.y/=t.y,this},n.prototype.divideScalar=function(t){return 0!==t?(this.x/=t,this.y/=t):(this.x=0,this.y=0),this},n.prototype.divideScalarX=function(t){return 0!==t?this.x/=t:this.x=0,this},n.prototype.divideScalarY=function(t){return 0!==t?this.y/=t:this.y=0,this},n.prototype.invertX=function(){return this.x*=-1,this},n.prototype.invertY=function(){return this.y*=-1,this},n.prototype.invert=function(){return this.invertX(),this.invertY(),this},n.prototype.multiplyX=function(t){return this.x*=t.x,this},n.prototype.multiplyY=function(t){return this.y*=t.y,this},n.prototype.multiply=function(t){return this.x*=t.x,this.y*=t.y,this},n.prototype.multiplyScalar=function(t){return this.x*=t,this.y*=t,this},n.prototype.multiplyScalarX=function(t){return this.x*=t,this},n.prototype.multiplyScalarY=function(t){return this.y*=t,this},n.prototype.normalize=function(){var t=this.length();return 0===t?(this.x=1,this.y=0):this.divide(n(t,t)),this},n.prototype.norm=n.prototype.normalize,n.prototype.limit=function(t,i){return Math.abs(this.x)>t&&(this.x*=i),Math.abs(this.y)>t&&(this.y*=i),this},n.prototype.randomize=function(t,i){return this.randomizeX(t,i),this.randomizeY(t,i),this},n.prototype.randomizeX=function(t,i){var r=Math.min(t.x,i.x),n=Math.max(t.x,i.x);return this.x=o(r,n),this},n.prototype.randomizeY=function(t,i){var r=Math.min(t.y,i.y),n=Math.max(t.y,i.y);return this.y=o(r,n),this},n.prototype.randomizeAny=function(t,i){return Math.round(Math.random())?this.randomizeX(t,i):this.randomizeY(t,i),this},n.prototype.unfloat=function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},n.prototype.toFixed=function(t){return"undefined"==typeof t&&(t=8),this.x=this.x.toFixed(t),this.y=this.y.toFixed(t),this},n.prototype.mixX=function(t,i){return"undefined"==typeof i&&(i=.5),this.x=(1-i)*this.x+i*t.x,this},n.prototype.mixY=function(t,i){return"undefined"==typeof i&&(i=.5),this.y=(1-i)*this.y+i*t.y,this},n.prototype.mix=function(t,i){return this.mixX(t,i),this.mixY(t,i),this},n.prototype.clone=function(){return new n(this.x,this.y)},n.prototype.copyX=function(t){return this.x=t.x,this},n.prototype.copyY=function(t){return this.y=t.y,this},n.prototype.copy=function(t){return this.copyX(t),this.copyY(t),this},n.prototype.zero=function(){return this.x=this.y=0,this},n.prototype.dot=function(t){return this.x*t.x+this.y*t.y},n.prototype.cross=function(t){return this.x*t.y-this.y*t.x},n.prototype.projectOnto=function(t){var i=(this.x*t.x+this.y*t.y)/(t.x*t.x+t.y*t.y);return this.x=i*t.x,this.y=i*t.y,this},n.prototype.horizontalAngle=function(){return Math.atan2(this.y,this.x)},n.prototype.horizontalAngleDeg=function(){return e(this.horizontalAngle())},n.prototype.verticalAngle=function(){return Math.atan2(this.x,this.y)},n.prototype.verticalAngleDeg=function(){return e(this.verticalAngle())},n.prototype.angle=n.prototype.horizontalAngle,n.prototype.angleDeg=n.prototype.horizontalAngleDeg,n.prototype.direction=n.prototype.horizontalAngle,n.prototype.rotate=function(t){var i=this.x*Math.cos(t)-this.y*Math.sin(t),r=this.x*Math.sin(t)+this.y*Math.cos(t);return this.x=i,this.y=r,this},n.prototype.rotateDeg=function(t){return t=s(t),this.rotate(t)},n.prototype.rotateTo=function(t){return this.rotate(t-this.angle())},n.prototype.rotateToDeg=function(t){return t=s(t),this.rotateTo(t)},n.prototype.rotateBy=function(t){var i=this.angle()+t;return this.rotate(i)},n.prototype.rotateByDeg=function(t){return t=s(t),this.rotateBy(t)},n.prototype.distanceX=function(t){return this.x-t.x},n.prototype.absDistanceX=function(t){return Math.abs(this.distanceX(t))},n.prototype.distanceY=function(t){return this.y-t.y},n.prototype.absDistanceY=function(t){return Math.abs(this.distanceY(t))},n.prototype.distance=function(t){return Math.sqrt(this.distanceSq(t))},n.prototype.distanceSq=function(t){var i=this.distanceX(t),r=this.distanceY(t);return i*i+r*r},n.prototype.length=function(){return Math.sqrt(this.lengthSq())},n.prototype.lengthSq=function(){return this.x*this.x+this.y*this.y},n.prototype.magnitude=n.prototype.length,n.prototype.isZero=function(){return 0===this.x&&0===this.y},n.prototype.isEqualTo=function(t){return this.x===t.x&&this.y===t.y},n.prototype.toString=function(){return"x:"+this.x+", y:"+this.y},n.prototype.toArray=function(){return[this.x,this.y]},n.prototype.toObject=function(){return{x:this.x,y:this.y}};var h=180/Math.PI},{}]},{},[1])(1)});
