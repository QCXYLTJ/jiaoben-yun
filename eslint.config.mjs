import js from '@eslint/js';
import globals from 'globals';
export default [
	js.configs.recommended,
	{
		rules: {
			curly: ['error', 'all'],
			'no-constant-condition': ['error', { checkLoops: false }],
			'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
			// 'no-unused-vars': [
			// 	'warn',
			// 	{
			// 		varsIgnorePattern: '^(player|event|trigger)$',
			// 		argsIgnorePattern: '^(player|event|trigger)$',
			// 	},
			// ],
			'no-unused-vars': 0,
			'no-undef': 'warn',
			'no-redeclare': 'warn',
		},
		languageOptions: {
			ecmaVersion: 13,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.es2015,
				...globals.node,
				...globals.serviceworker,
				...globals.worker,
				shanhe: 'readonly',
				factorial: 'readonly',
				deepClone: 'readonly',
				number0: 'readonly',
				number1: 'readonly',
				numberq0: 'readonly',
				numberq1: 'readonly',
				QQQ: 'readonly',
				HL: 'readonly',
				source: 'readonly',
				num: 'readonly',
				result: 'readonly',
				card: 'readonly',
				cards: 'readonly',
				target: 'readonly',
				targets: 'readonly',
				player: 'readonly',
				event: 'readonly',
				trigger: 'readonly', //未定义但被使用报错取消
			},
		},
	},
	{ files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'], settings: {} },
];
