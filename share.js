/**
 * 分享 
 */
;MC.define('widget/share', function(exports){
	var modId = 'widget/share',
		noteElId = 'weixinShareNoteCtId',
		maskSelector = '.f-mask',
		selector = '.share';
	
	var show = function(data, callback) {
		var $share = $(selector);
		if (!MC.isWeixin()) {
			try {
				$share.find('.i-weixin').parent().hide();
			} catch (e) {
			}
		}
		$share.removeClass('hidden');
		setTimeout(function(){
			$share.addClass('show').attr('mc-pop', 'show');
		}, 100);
		MC.require('widget/mask', function(mask){
			mask.show(function(){
				MC.routePopOut(modId);
			});
		});
	};
	
	var hide = function(callback) {
		$('#' + noteElId).remove();
		$(maskSelector).removeClass('share-mask');
		MC.require('widget/mask', function(mask){
			mask.hide(hideShare);
		});
		MC.Event.once('weixinShareHide');
	};
	
	var hideShare = function() {
		var $share = $(selector);
		$share.removeClass('show').attr('mc-pop', 'hide');
		setTimeout(function(){
			$share.addClass('hidden');
		}, 400);
	};
	
	var domReady = function($btn, data, params) {
		var $shareCt = $(selector); // 分享弹出层
		var $shareBtn = MC.isString($btn) ? $('#' + $btn) : $btn;  // 分享按钮
		var shareUrl = data.shareUrl || (window.location.protocol + '//' + window.location.host + '/m/message/' + data.id);
		
		$shareCt.attr('mc-pop', 'hide').attr('mc-mod', MC.modId2Flag(modId));
		$shareBtn.off('click').on('click', function(){
			MC.routePopIn(modId, data);
			
			// 绑定事件
			$shareCt.find('a').each(function(index, el){
				$(el).off('click').on('click', function(){
					var url = '';
					if (index == 0) {
						url = weiboShare(data, shareUrl);
					} else if (index == 1) {
						url = qqShare(data, shareUrl);
					} else if (index == 2) {
						weixinShare(data, params);
					}
					url && MC.navigate(url);
				});
			});
				
			return false;
		});
	};
	
	var weiboShare = function(data, url) {
		var weiboClientId = GB.sysParam('weiboClientId'),
			title = (data.title || data.body);
		
		if (title.length > 100) {
			title = title.substr(0, 100) + '…';
		}
		url = url.replace('uu.com.cn', 'mykuaiji.com');// 因微博开发者账号是用的mykuaiji域名
	    var link = "http://service.weibo.com/share/mobile.php?url=" + encodeURIComponent(url) + 
	    		"&appkey=" + weiboClientId + "&title=" + encodeURIComponent(title);
	    return link;
	};
	
	var qqShare = function(data, url) {
		var qqClientId = GB.sysParam('qqClientId'),
			title = (data.title || data.body);
		var summary = data.summary || '服务社区是一个互动式知识问答分享平台。';
		
	    var link = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=" + encodeURIComponent(url) + 
	    		"&appkey=" + qqClientId + "&title=" + encodeURIComponent(title) +'&summary='+ encodeURIComponent(summary);
	    return link;
	};
	
	var weixinShare = function(data, params) {
		var $el = $('#' + noteElId);
		if ($el.length > 0) {
			return;
		}
		
		var html = [
			'<div id="', noteElId, '" class="share-note-ct">',
				'<i class="i-share-arrow"></i>',
				'<div class="text">点击右上角菜单按钮，选择“分享到朋友圈”或“发送给朋友”</div>',
				//'<div class="close">知道了</div>',
			'</div>'
		].join('');
		$('body').append(html);
		$(maskSelector).addClass('share-mask');
		$('#' + noteElId).off('click').on('click', function(){
			hide();
		}).off('touchmove').on('touchmove', function(e){
			e.preventDefault();
		});
		
		if (params && params.isSetWeixinShareData) {
			// 设置微信分享的数据
			GB.setWeixinShareData({
				desc: (data.title || data.body),
				url: data.shareUrl || '',
				img: data.shareImg || '',
			});
			// 隐藏分享div时，重置微信分享数据
			MC.Event.on('weixinShareHide', function(){
				GB.resetWeixinShareData();
			});
		}
	};
	
	return {
		domReady: domReady,
		show: show,
		hide: hide,
		weiboShare: weiboShare,
		qqShare: qqShare,
		weixinShare: weixinShare
	};
});
