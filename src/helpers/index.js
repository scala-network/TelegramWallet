module.export.metaButton = () => {
	return {
		reply_markup: {
			inline_keyboard: [
				[{ text: '✅Confirm?', callback_data: 'meta' }]
				[{ text: '🚫 Cancel', callback_data: 'meta' }]
			],
			resize_keyboard: true,
			one_time_keyboard: true
		}
	}
}