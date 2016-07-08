/**
 * 附件显示 
 */
MC.define('util/attach', function(exports){
	var picObj = {
		html: function(data, params, domReadyPromise) {
			var pics = data.pics;
			if (MC.isEmpty(pics)) {
				return '';
			}
			params || (params = {});
			
			var html = [],
				limit = params.limit ? (params.limit - 1) : 0,
				seedId = params.seedId || MC.genId('pic'),
				picsCt = [];
			html.push('<div class="pic-ct cl ', params['class'], '">');
			MC.each(pics, function(pic, i){
				var src = pic.crop || pic.small,
					elId = seedId + 'Pic' + i,
					cntHtml = '',
					isBreak = false;
					
				if (limit && i >= limit) {
					isBreak = true;
					cntHtml = '<span class="pic-cnt"><span class="mask"></span><span class="text">共' + pics.length + '张图片</span></span>';
				}	
				html.push(MC.genHtml('p', cntHtml, {
					'id': elId,
					'class': 'f-icons-bf pic-item ' + (params.lazy ? '' : ' loaded'),
					'style': params.lazy ? null : ('background-image:url(' + src + ')'),
					'mc-lazyload': params.lazy ? src : null
				}));
				picsCt.push({
					elId: elId,
					pic: pic
				});
				if (isBreak) {
					return false;
				}
			});
			html.push('</div>');
			
			// 绑定事件
			domReadyPromise && domReadyPromise.then(function(){
				picObj.domReady(picsCt, data, params);
			});
			
			return html.join('');
		},
		domReady: function(picsCt, data, params) {
			params.isPreview && MC.each(picsCt, function(picCt, index){
				$('#' + picCt.elId).off('click').on('click', function(){
					MC.routePopIn('widget/picview', {
						data: data,
						index: index
					});
					return false;
				});
			});
		}
	};
	
	var fileObj = {
		html: function(data, params, domReadyPromise) {
			var files = data.files;
			if (MC.isEmpty(files)) {
				return '';
			}
			
			var html = [];
			params || (params = {});
			html.push('<div class="file-ct">');
			MC.each(files, function(file){
				var size = file.size / 1024;
				size = (size < 1024) ? (size.toFixed(2) + 'K') : ((size /= 1024).toFixed(2) + 'M');
				html.push(
					'<div class="file-item">',
						'<div class="file-row">',
							'<span class="file-ext fl file-ext-', file.ext.toLowerCase(), '"></span>',
							fileObj.fileLink(file.id, ['<span><span class="c3">', file.name, '</span><span class="c9"> (', size, ')</span></span>'].join('')),
						'</div>',
					'</div>'
				);
			});
			html.push('</div>');
			return html.join('');
		},
		fileLink: function(id, html) {
			return MC.genHtml('a', html, {
				'href': downloadUrl(id),
				'onclick': 'javascript:event.stopPropagation();'
			});
		}
	};
	
	var downloadUrl = function(id) {
		return '/wenku/Download/' + id;
	};
	
	var videoObj = {
		render: function($ct) {
			var $videos = $ct.find('.video');
			if ($videos.length <= 0) {
				return;
			}
			
			MC.require('youku', function(){
				var vidEls = $ct.find("[vid]");
				for (var i = 0, el; el = vidEls[i]; i++) {
					var elId = MC.genId('video'),
						$el = $(el),
						vid = $el.attr('vid');
					$el.attr('id', elId);
					new YKU.Player(elId,{
						styleid: '0',
						width: '100%',
						height: '100%',
						client_id: 'a4035a135b9fafdc',
						vid: vid,
						show_related: false,
						flashext: '<param name=wmode value=opaque>'
					});
				}
			});
		}
	};
	
	//---------------------------------------------------------
	
	exports.pic = picObj;
	exports.file = fileObj;
	exports.video = videoObj;
});