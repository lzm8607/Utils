/**
 * 上传图片
 */
;MC.define('widget/picupl', function(exports){
	var prompt = MC.require('widget/prompt');
	
	var Upload = function(args) {
		this.init(args);
	};
	MC.merge(Upload.prototype, {
		init: function(args) {
			this.seedId = MC.genId('upl');
			this.itemsCtId = this.seedId + 'ItemsCt';
			this.iptId = this.seedId + 'Upl';
			this.itemCntId = this.seedId + 'ItemCnt';
			this.guideId = this.seedId + 'GuideCt';
			
			this.canUploadCnt = 6;
			this.uploadedFile = [];
		},
		render: function(renderId) {
			$('#' + renderId).html(this.html());
			this.bindEvent();
		},
		html: function() {
			var html = [
				'<div class="upl-ct" id="', this.itemsCtId, '">', this.addBtnHtml(), '</div>',
				'<div class="upl-tip">还可上传<span id="', this.itemCntId, '">', this.canUploadCnt, '</span>张图片，单张图片最大10兆</div>'
			].join('');
			return html;
		},
		addBtnHtml: function() {
			var html = [
				'<li class="upl-add">',
					'<div class="upl-ipt-ct"><input id="', this.iptId, '" type="file" name="files" class="upl-ipt" multiple accept="image/*" /></div>',
					'<div class="upl-icon"><i class="plus"></i></div>',
					'<div class="upl-guide" id="', this.guideId, '"></div>',
				'</li>'
			];
			return html.join('');
		},
		renderPicItem: function(sendPromise) {
			var scope = this;
			
			// 渲染上传图片的视图
			var elId = MC.genId('upl');
			var $el = null;
			var html = [
				'<li class="upl-item f-icons-bf" id="', elId, '">',
					'<div class="upl-mask"></div>',
					'<span class="loading-s2 white"><i class="t1"></i><i class="t2"></i><i class="t3"></i></span>',
					'<div class="img"></div>',
				'</li>'
			].join('');
			$('#' + this.itemsCtId).prepend(html);
			$el = $('#' + elId);
			
			// 隐藏提示图片
			$('#' + this.guideId).hide();
			
			// 为图片视图绑定事件
			$el.off('click').on('click', function(){
				if (window.confirm("是否删除图片？")) {
					// 断开连接
					sendPromise.reject(true);
					// 删除图片视图
					scope.remove($el);
				}
			});
			
			// 根据图片上传结果，界面做相应变化
			sendPromise.then(function(file){
				// 设置图片id和url
				$el.attr('data-file-id', file.id);
				$el.find('.img').css('background-image', 'url(' + (file.thumb || file.url) + ')');
				
				$el.removeClass('f-icons-bf');
				$el.find('.upl-mask').remove();
				$el.find('.loading-s2').remove();
				$el.append('<i class="i-complete"></i>');
			}, function(forceOff){				
				// 删除图片视图
				forceOff || scope.remove($el);
				return forceOff;
			});
		},
		renderCnt: function(action) {
			(action == 'add') ? this.canUploadCnt++ : this.canUploadCnt--;
			(this.canUploadCnt > 6) && (this.canUploadCnt = 6);
			$('#' + this.itemCntId).html(this.canUploadCnt);
		},
		//--------------------------------------------------------------------------------
		bindEvent: function() {
			var scope = this;
			$('#' + this.iptId).off('change').on('change', function(e){
				scope.submit();
				//console.log(e.target.files);
			});
		}, 
		submit: function() {
			var files2up = Array.prototype.slice.call(document.getElementById(this.iptId).files);
			var scope = this;
			MC.each(files2up, function(file){
				if (file.size / (1024 * 1024) > 10) {
					prompt.failure('您上传了大于10M的图片，被系统取消');
					return;
				}
				if (scope.canUploadCnt < 1) {
					return;
				}
				scope.renderCnt();
				
				var sendPromise = new MC.Promise();				
				var fd = new FormData();
	        	fd.append('files', file);
	        	fd.append('csrftoken', GB.sysParam('csrftoken'));
	        		        	
				scope._onSubmit(sendPromise);
				
				// 上传文件
	        	var xhr = new XMLHttpRequest();
	            xhr.addEventListener("load", function(e){
	            	try {
	            		var record = JSON.parse(e.target.responseText);
	            		scope._onComplete(record, sendPromise);
	            	} catch (e) {
	            		sendPromise.reject();
	            	}
	            }, false);
	            xhr.addEventListener("error", function(){
	            	sendPromise.reject();
	            }, false);
	            xhr.addEventListener("abort", function(){
	            	sendPromise.reject();
	            }, false);
	            xhr.open("POST", "/api/v1/upload/UploadFile");
	            xhr.send(fd);
	            
	            sendPromise.then(function(){
	            }, function(forceOff){
	            	// 中止上传请求
	            	forceOff && xhr.abort();
	            	return forceOff;
	            });
			});
		},
		remove: function($el) {
			if (!$el) {
				return;
			}
			// 删除图片id和视图
			var fileId = $el.attr('data-file-id');
			if (fileId) {
				this.removeAttach(fileId);
			}
			$el.remove();
			this.renderCnt('add');
			if (this.canUploadCnt >= 6) {
				$('#' + this.guideId).show();
			}
		},
		_onSubmit: function(sendPromise) {
			this.renderPicItem(sendPromise);
		},
		_onComplete: function(record, sendPromise) {
			var uploadedFile = {
				id: record._id['$id'],
				url: record.original_path,
				thumb: record.top_img
			};
			this.uploadedFile.push(uploadedFile);
			sendPromise.resolve(uploadedFile);
		},
		//--------------------------------------------------------------------------------
		clear: function() {
			this.uploadedFile = [];
		},
		getAttaches: function() {
			return this.uploadedFile;
		},
		removeAttach: function(id) {
			MC.each(this.uploadedFile, function(file, i){
				if (file.id == id) {
					this.uploadedFile.splice(i, 1);
					return false;
				}
			}, this);
		}
	});
	MC.eventSupport(Upload.prototype);
	
	exports.Upload = Upload;
});
