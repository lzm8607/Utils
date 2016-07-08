/**
 * 图片预览 
 */
MC.define('widget/picview', function(exports) {
	var PicView = function(args) {
		this.init(args);
	};
	MC.merge(PicView.prototype, {
		render: function(renderId) {
			this.renderId = renderId || this.renderId;
			this.reset();
			
			$('#' + this.renderId).html(this.html(this.pics));
			
			this.$ct = $('.pv-mask');
			this.bindEvent();
			this.changeIndex(this.index, true);
		},
		html: function() {
			var picHtml = [];
			MC.each(this.pics, function(pic, i){
				picHtml.push(MC.genHtml('li', '', {
					'class': 'pv-img'
				}, {
					'width': this.width + 'px',
					'height': this.height + 'px'
				}));
			}, this);
			
			var html = [
				'<div class="pv-mask">',
					MC.genHtml('ul', picHtml.join(''), {
						'class': 'pv-imgs flex'
					}, {
						'width': this.width * this.pics.length + 'px',
						'height': this.height + 'px',
						'line-height': this.height + 'px'
					}),
					'<span class="loading-s2 white" style="display:none;"><i class="t1"></i><i class="t2"></i><i class="t3"></i></span>',
					'<p class="pv-counts"><span class="text" id="', this.cntId, '"></span></p>',
					'<div class="pv-info">',
						'<div class="pv-action cl">',
							'<div class="pv-icons pv-zoom up"></div>',
							'<div class="pv-icons pv-back"><span class="text">返回</span></div>',
						'</div>',
					'</div>',
				'</div>'
			];
			return html.join('');
		},
		changeIndex: function(index, force) {
			if (!index || index < 0) {
				index = 0;
			} else if (index >= this.pics.length) {
				index = this.pics.length - 1;
			}
			var changed = (this.index != index);
			this.index = index;
			var $imgsCt = this.$ct.find('.pv-imgs');
			$imgsCt.css({
				"-webkit-transition-duration" : force ? "0" : "200" + "ms",
				"transition-duration" : force ? "0" : "200" + "ms",
				"-webkit-transform" : "translate(-" + index * this.width + "px)",
				"transform" : "translate(-" + index * this.width + "px)"
			});
			var $li = $imgsCt.find("li").eq(index);
			var $imgs = $li.find("img");
			if ($imgs.length > 0) {
				this.zoomIconFix($imgs[0]);
			} else {
				this.$ct.find(".loading-s2").show();
				var img = this.newImg(this.pics[index]);
				$li.html("").append(img);
			}
			if (changed || force) {
				this.$ct.find("#" + this.cntId).html(index + 1 + "/" + this.pics.length);
			}
		},
		newImg: function(pic) {
			var scope = this;
			var img = new Image;
			img.onload = function() {
				img.onload = null;
				scope.$ct.find(".loading-s2").hide();
				$(img).css({
					"-webkit-transform": "",
					"transform" : ""
				});
				img.style.opacity = "";
				scope.zoomIconFix(img);
				if (scope.isLongPic(img)) {
					setTimeout(function() {
						scope.scaleUp(img);
					}, 0);
				}
			};
			img.ontimeout = img.onerror = function() {
				scope.$ct.find(".loading-s2").hide();
			};
			img.style.opacity = "0";
			img.src = this.getPicUrl(pic);
			return img;
		}
	});
	MC.merge(PicView.prototype, {
		bindEvent: function() {
			var scope = this;
			$('.pv-back').off('click').on('click', function(){
				MC.routePopOut('widget/picview');
			});
			$('.pv-zoom').off('click').on('click', function(e){
				if (!$(this).hasClass("disabled")) {
					scope.onZoom(e);
				}
			});
			this.$ct.off("touchstart touchmove touchend touchcancel")
					.on("touchstart touchmove touchend touchcancel", function(e) {
				switch(e.type) {
					case "touchstart":
						scope.onTouchStart(e);
						break;
					case "touchmove":
						e.preventDefault();
						scope.onTouchMove(e);
						break;
					case "touchcancel":
					case "touchend":
						scope.onTouchEnd(e);
						break;
				}
			});
			$(window).off("resize.picview").on("resize.picview", function(e){
				scope.onResize(e);
			});
		},
		onTouchStart: function(e) {
			if (this.advancedSupport && e.originalEvent.touches && e.originalEvent.touches.length >= 2) {
				var img = this.getImg();
				$(img).css({
					"-webkit-transition-duration": "0ms",
					"transition-duration": "0ms"
				});
				this.isDoubleZoom = true;
				this.doubleZoomOrg = this.zoom;
				this.doubleDistOrg = this.getDist(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY, e.originalEvent.touches[1].pageX, e.originalEvent.touches[1].pageY);
				return;
			}
			
			e = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
			this.isDoubleZoom = false;
			this.start = [e.pageX, e.pageY];
			this.org = [e.pageX, e.pageY];
			this.orgTime = Date.now();
			this.hasMoved = false;			
			if (this.zoom != 1) {
				this.zoomXY = this.zoomXY || [0, 0];
				this.orgZoomXY = [this.zoomXY[0], this.zoomXY[1]];
				var img = this.getImg();
				if (img) {
					$(img).css({
						"-webkit-transition-duration": "0ms",
						"transition-duration": "0ms"
					});
				}
				this.drag = true;
			} else {
				if (this.pics.length == 1) {
					return;
				}
				this.$ct.find(".pv-imgs").css({
					"-webkit-transition-duration": "0ms",
					"transition-duration": "0ms"
				});
				this.transX = -this.index * this.width;
				this.slide = true;
			}
		},
		onTouchMove: function(e) {
			if (this.advancedSupport && e.originalEvent.touches && e.originalEvent.touches.length >= 2) {
				var newDist = this.getDist(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY, e.originalEvent.touches[1].pageX, e.originalEvent.touches[1].pageY);
				this.zoom = newDist * this.doubleZoomOrg / this.doubleDistOrg;
				var img = this.getImg();
				$(img).css({
					"-webkit-transition-duration": "0ms",
					"transition-duration": "0ms"
				});
				if (this.zoom < 1) {
					this.zoom = 1;
					this.zoomXY = [0, 0];
					$(img).css({
						"-webkit-transition-duration": "200ms",
						"transition-duration": "200ms"
					});
				} else if (this.zoom > this.getScale(img) * 2) {
					this.zoom = this.getScale(img) * 2;
				}
				$(img).css({
					"-webkit-transform": "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)",
					"transform": "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)"
				});
				return;
			}
			if (this.isDoubleZoom) {
				return;
			}
			e = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
			if (!this.hasMoved && (Math.abs(e.pageX - this.org[0]) > 5 || Math.abs(e.pageY - this.org[1]) > 5)) {
				this.hasMoved = true;
			}
			if (this.zoom != 1) {
				// 图片处于缩放状态
				var deltaX = (e.pageX - this.start[0]) / this.zoom,
					deltaY = (e.pageY - this.start[1]) / this.zoom;
				this.start = [e.pageX, e.pageY];
				var img = this.getImg();
				var newWidth = img.clientWidth * this.zoom, 
					newHeight = img.clientHeight * this.zoom;
				var borderX = (newWidth - this.width) / 2 / this.zoom, 
					borderY = (newHeight - this.height) / 2 / this.zoom;
				(borderX >= 0) && (this.zoomXY[0] < -borderX || this.zoomXY[0] > borderX) && (deltaX /= 3);
				(borderY > 0) && (this.zoomXY[1] < -borderY || this.zoomXY[1] > borderY) && (deltaY /= 3);
				this.zoomXY[0] += deltaX;
				this.zoomXY[1] += deltaY;
				if (this.pics.length == 1 && newWidth < this.width) {
					this.zoomXY[0] = 0;
				} else if (newHeight < this.height) {
					this.zoomXY[1] = 0;
				}
				$(img).css({
					"-webkit-transform" : "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)",
					"transform" : "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)"
				});
			} else {
				// 图片处于滑动预览状态
				if (!this.slide) {
					return;
				}
				var deltaX = e.pageX - this.start[0];
				if (this.transX > 0 || this.transX < -this.width * (this.pics.length - 1)) {
					deltaX /= 4;
				}
				this.transX = -this.index * this.width + deltaX;
				this.$ct.find(".pv-imgs").css({
					"-webkit-transform": "translateX(" + this.transX + "px)",
					"transform": "translateX(" + this.transX + "px)"
				});
			}
		},
		onTouchEnd: function(e) {
			if (this.isDoubleZoom) {
				this.zoomIconFix(this.getImg());
				return;
			}
			if (!this.hasMoved) {
				return;
			}
			if (this.zoom != 1) {
				if (!this.drag) {
					return;
				}
				var img = this.getImg();
				var newWidth = img.clientWidth * this.zoom, 
					newHeight = img.clientHeight * this.zoom;
				var borderX = (newWidth - this.width) / 2 / this.zoom, 
					borderY = (newHeight - this.height) / 2 / this.zoom;
				var len = this.pics.length;
				if (len > 1 && borderX >= 0) {
					var updateDelta = 0;
					var switchDelta = this.width / 6;
					if (this.zoomXY[0] < -borderX - switchDelta / this.zoom && this.index < len - 1) {
						updateDelta = 1;
					} else if (this.zoomXY[0] > borderX + switchDelta / this.zoom && this.index > 0) {
						updateDelta = -1;
					}
					if (updateDelta != 0) {
						this.scaleDown(img);
						this.changeIndex(this.index + updateDelta);
						return;
					}
				}
				var delta = Date.now() - this.orgTime;
				if (delta < 300) {
					(delta <= 10) && (delta = 10);
					var deltaDis = Math.pow(180 / delta, 2);
					this.zoomXY[0] += (this.zoomXY[0] - this.orgZoomXY[0]) * deltaDis;
					this.zoomXY[1] += (this.zoomXY[1] - this.orgZoomXY[1]) * deltaDis;
					$(img).css({
						"-webkit-transition" : "400ms cubic-bezier(0.08,0.65,0.79,1)",
						"transition" : "400ms cubic-bezier(0.08,0.65,0.79,1)"
					});
				} else {
					$(img).css({
						"-webkit-transition" : "200ms linear",
						"transition" : "200ms linear"
					});
				}
				if (borderX >= 0) {
					if (this.zoomXY[0] < -borderX) {
						this.zoomXY[0] = -borderX;
					} else if (this.zoomXY[0] > borderX) {
						this.zoomXY[0] = borderX;
					}
				}
				if (borderY > 0) {
					if (this.zoomXY[1] < -borderY) {
						this.zoomXY[1] = -borderY;
					} else if (this.zoomXY[1] > borderY) {
						this.zoomXY[1] = borderY;
					}
				}
				if (this.isLongPic(img) && Math.abs(this.zoomXY[0]) < 10) {
					$(img).css({
						"-webkit-transform" : "scale(" + this.zoom + ") translate(0px," + this.zoomXY[1] + "px)",
						"transform" : "scale(" + this.zoom + ") translate(0px," + this.zoomXY[1] + "px)"
					});
				} else {
					$(img).css({
						"-webkit-transform" : "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)",
						"transform" : "scale(" + this.zoom + ") translate(" + this.zoomXY[0] + "px," + this.zoomXY[1] + "px)"
					});
					this.drag = false;
				}
			} else {
				if (!this.slide) {
					return;
				}
				var deltaX = this.transX - -this.index * this.width;
				var updateDelta = 0;
				if (deltaX > 50) {
					updateDelta = -1;
				} else if (deltaX < -50) {
					updateDelta = 1;
				}
				this.changeIndex(this.index + updateDelta);
				this.slide = false;
			}
		},
		onZoom: function(e) {
			var img = this.getImg();
			if (!img) {
				return;
			}
			!(this.zoom > 1 || this.zoom < 1) ? this.scaleUp(img) : this.scaleDown(img);
		},
		scaleUp : function(img) {
			var scale = this.getScale(img);
			if (scale > 1) {
				$(img).css({
					"-webkit-transform" : "scale(" + scale + ")",
					"transform" : "scale(" + scale + ")",
					"-webkit-transition" : "200ms",
					"transition" : "200ms"
				});
			}
			this.zoom = scale;
			this.afterZoom(img);
		},
		scaleDown: function(img) {
			this.zoom = 1;
			this.zoomXY = [0, 0];
			this.doubleDistOrg = 1;
			this.doubleZoomOrg = 1;
			$(img).css({
				"-webkit-transform": "scale(1)",
				"transform": "scale(1)",
				"-webkit-transition": "200ms",
				"transition": "200ms"
			});
			this.afterZoom(img);
		},
		afterZoom: function(img) {
			if (this.zoom > 1 && this.isLongPic(img)) {
				var newHeight = img.clientHeight * this.zoom;
				var borderY = (newHeight - this.height) / 2 / this.zoom;
				if (borderY > 0) {
					this.zoomXY[1] = borderY;
					$(img).css({
						"-webkit-transform": "scale(" + this.zoom + ") translate(0px," + borderY + "px)",
						"transform": "scale(" + this.zoom + ") translate(0px," + borderY + "px)"
					});
				}
			}
			this.zoomIconFix(img);
		},
		zoomIconFix: function(img) {
			var icon = this.$ct.find(".pv-zoom");
			var zoom = this.zoom;
			if (!icon.size()) {
				return;
			}
			var cls = "pv-icons pv-zoom";
			cls += (zoom == 1 ? " up" : " down");
			if (img.naturalWidth <= this.width && img.naturalHeight <= this.height) {
				cls += " disabled";
			}
			icon.attr("class", cls);
		},
		onResize: function(e) {
			clearTimeout(this.resizeTimer);
			var scope = this;
			this.resizeTimer = setTimeout(function() {
				(scope.zoom != 1) && (scope.scaleDown(scope.getImg()));
				scope.reset();
				var $imgsCt = scope.$ct.find('.pv-imgs');
				$imgsCt.find('li').css({
					width: scope.width + 'px',
					height: scope.height + 'px'
				});
				$imgsCt.css({
					'width': scope.width * scope.pics.length + 'px',
					'height': scope.height + 'px',
					'line-height': scope.height + 'px'
				});
				scope.changeIndex(scope.index, true);
			}, 300);
		}
	});
	MC.merge(PicView.prototype, {
		doubleZoomOrg: 1,
		doubleDistOrg: 1,
		isDoubleZoom: false,
		resizeTimer: null,
		advancedSupport: true,
		init: function(args) {
			MC.merge(this, args.prop);
			this.seedId = MC.genId('pv');
			this.cntId = this.seedId + 'Cnt';
			this.loadingId = this.seedId + 'Loading';
		},
		reset: function() {
			this.width = Math.max(window.innerWidth, document.body.clientWidth);
			this.height = window.innerHeight;
			// 图片在缩放状态时的“缩放比例”
			this.zoom = 1;
			// 图片在缩放状态时的“位置”
			this.zoomXY = [0, 0];
		},
		setParams: function(params) {
			params || (params = {});
			this.index = params.index || 0;
		},
		setData: function(data) {
			this.pics = data.pics;
		},
		getPicUrl: function(pic) {
			return pic.original;
		},
		isLongPic: function(img) {
			return img.clientHeight / img.clientWidth >= 3.5;
		},
		getImg: function(index) {
			var img = this.$ct.find("li").eq(index || this.index).find("img");
			return (img.size() == 1) ? img[0] : null;
		},
		getScale: function(img) {
			if (this.isLongPic(img)) {
				return this.width / img.clientWidth;
			} else {
				var h = img.naturalHeight, w = img.naturalWidth;
				var hScale = h / img.clientHeight, wScale = w / img.clientWidth;
				return (hScale > wScale ? wScale : hScale);
			}
		},
		getDist : function(x1, y1, x2, y2) {
			return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2), 2);
		}
	});
	
	//-------------------------------------------------------------------------
	
	var viewObj = null;
	var render = function(renderId, params) {
		params || (params = {});
		viewObj || (viewObj = new PicView(params));
		viewObj.setData(params.data);
		viewObj.setParams(params);
		viewObj.render(renderId);
	};
	
	var show = function(data, callback) {
		if (show.showState || hide.hideState) {
			return;
		}
		show.showState = true;
		
		var $popCt = $('#' + MC.config('popCtId'));
		var $pagesCt = $('.f-page');
		
		// 转场动画显示
		MC.popSlideIn($popCt, $pagesCt, function(){
			show.showState = false;
		});
		
		// 渲染页面内容		
		$popCt.show().attr('mc-pop', 'show').attr('mc-mod', 'widget/picview');
		render(MC.config('popMainId'), data);
	};
	
	var hide = function() {
		if (hide.hideState || show.showState) {
			return;
		}
		hide.hideState = true;
		
		var $popCt = $('#' + MC.config('popCtId'));
		var $pagesCt = $('.f-page');
		
		// 转场动画隐藏
		MC.popSlideOut($popCt, $pagesCt, function(){
			hide.hideState = false;
		});
		
		$popCt.attr('mc-pop', 'hide').attr('mc-mod', '');
		setTimeout(function(){
			$popCt.hide().find('#' + MC.config('popMainId')).html(MC.loadingPageHtml());
		}, 400);
	};
	
	return {
		show: show,
		hide: hide,
		render: render
	};
});
