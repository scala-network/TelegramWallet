'use strict';

module.exports.metaButton = () => {
	return {
		reply_markup: {
			inline_keyboard: [
				[{
					text: '✅ Confirm?', callback_data: 'meta_confirm'
				}, {
					text: '🚫 Cancel', callback_data: 'meta_cancel'
				}]
			],
			resize_keyboard: true,
			one_time_keyboard: true
		}
	};
};
