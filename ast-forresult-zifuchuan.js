// ============================================================
// 引入 Node.js 内置模块
// ============================================================
const fs = require('fs'); // 读写文件
const path = require('path'); // 处理文件路径

// ============================================================
// 引入 Babel 工具包（用于解析、遍历、生成、构造代码）
// ============================================================
const parser = require('@babel/parser'); // 把 JS 代码解析成 AST（抽象语法树）
const traverse = require('@babel/traverse').default; // 遍历 AST 节点
const generate = require('@babel/generator').default; // 把 AST 再变回 JS 代码
const t = require('@babel/types'); // 用来创建各种 AST 节点（如变量、调用、成员访问等）

/**
 * 核心转换函数：在 AST 中查找所有 `await xxx.forResult('某字符串')`
 * 并替换为 `(await xxx.forResult()).某字符串`
 *
 * 比如：
 *   输入：const result = await api.getData().forResult('data');
 *   输出：const result = (await api.getData().forResult()).data;
 */
function processAst(ast) {
	// 收集所有需要替换的节点（为了安全，先收集再统一替换）
	const replacements = [];

	// 遍历 AST 中的所有节点
	traverse(ast, {
		// 只关心 `AwaitExpression`（await 表达式）
		AwaitExpression(path) {
			const node = path.node;

			// ----- 第一步：检查 await 后面是不是一个函数调用 -----
			// 例如：await xxx()  这里 xxx() 是一个 CallExpression
			if (!t.isCallExpression(node.argument)) return;
			const call = node.argument;

			// ----- 第二步：检查这个调用是不是 `xxx.forResult(...)` -----
			// 即调用者（callee）是一个成员访问，且属性名为 'forResult'
			if (!t.isMemberExpression(call.callee)) return;
			const member = call.callee;
			if (!t.isIdentifier(member.property) || member.property.name !== 'forResult') return;

			// ----- 第三步：检查 forResult 是否只有一个参数，且是字符串字面量 -----
			// 例如：forResult('cards') 或 forResult('data')
			if (call.arguments.length !== 1) return;
			const arg = call.arguments[0];
			if (!t.isStringLiteral(arg)) return;

			// 提取这个字符串内容，比如 'cards' → 'cards'
			const propName = arg.value;

			// ----- 第四步：构建新的表达式 -----
			// 1. 新的调用：xxx.forResult()  不加参数
			const newCall = t.callExpression(member, []);

			// 2. 外面套上 await：await xxx.forResult()
			const newAwait = t.awaitExpression(newCall);

			// 3. 取返回值的属性： (await xxx.forResult()).propName
			//    用 t.identifier(propName) 表示属性名，computed: false 表示用点号访问
			const newExpr = t.memberExpression(
				newAwait,
				t.identifier(propName),
				false, // false 表示点号（即 .propName），true 表示方括号（即 ['propName']）
			);

			// 记录这个需要替换的节点
			replacements.push({ path, newNode: newExpr });
		},
	});

	// 执行替换（遍历过程中不能修改，所以统一在遍历结束后替换）
	for (const { path, newNode } of replacements) {
		path.replaceWith(newNode);
	}
}

/**
 * 递归处理一个目录下的所有 .js/.mjs/.cjs 文件（跳过 node_modules 和 .git）
 */
async function processDirectory(dir) {
	// 读取当前目录的内容，包含文件/子目录信息
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// 如果是目录，且不是 node_modules 或 .git，则递归进入
			if (entry.name === 'node_modules' || entry.name === '.git') continue;
			await processDirectory(fullPath);
		} else if (entry.isFile()) {
			// 如果是文件，且扩展名是 .js/.mjs/.cjs，则处理
			const ext = path.extname(entry.name);
			if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
				await processFile(fullPath);
			}
		}
	}
}

/**
 * 处理单个文件：读取、解析、转换、写回
 */
async function processFile(fullPath) {
	console.log(`Processing: ${fullPath}`);
	const code = fs.readFileSync(fullPath, 'utf8');

	try {
		// 1. 解析代码为 AST
		const ast = parser.parse(code, {
			sourceType: 'module', // 支持 import/export
			plugins: ['classProperties', 'objectRestSpread', 'dynamicImport', 'optionalChaining', 'nullishCoalescingOperator'], // 支持现代 JavaScript 语法
		});

		// 2. 执行转换
		processAst(ast);

		// 3. 从 AST 生成新的代码
		const output = generate(
			ast,
			{
				retainLines: true, // 尽量保留原行号
				compact: false, // 不压缩，保持可读
				comments: true, // 保留注释
			},
			code,
		);

		// 4. 写回文件
		fs.writeFileSync(fullPath, output.code, 'utf8');
	} catch (err) {
		console.error(`Error processing ${fullPath}:`, err.message);
	}
}

// ============================================================
// 程序入口：从当前工作目录开始
// ============================================================
const targetDir = process.cwd(); // 获取运行命令时的当前目录
console.log(`开始处理目录: ${targetDir}`);
processDirectory(targetDir)
	.then(() => console.log('处理完成！'))
	.catch((err) => console.error('发生错误:', err));
