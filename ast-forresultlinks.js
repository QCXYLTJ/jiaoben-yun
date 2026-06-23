const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * 判断节点是否为"独立语句"(即通常以分号结尾的语句)
 */
function isStandaloneStatement(node) {
  return t.isExpressionStatement(node) ||
  t.isVariableDeclaration(node) ||
  t.isFunctionDeclaration(node) ||
  t.isClassDeclaration(node) ||
  t.isReturnStatement(node) ||
  t.isThrowStatement(node) ||
  t.isBreakStatement(node) ||
  t.isContinueStatement(node) ||
  t.isDebuggerStatement(node) ||
  t.isEmptyStatement(node);
}

/**
 * 检查是否匹配目标模式:
 * const xxx = await yyy().forResultzzz();
 * 要求 zzz 不为空（即 forResult 后面必须有后缀）
 * 
 * 其中 xxx 是任意变量名，yyy 是任意表达式
 */
function isTargetPattern(node) {
  if (!t.isVariableDeclaration(node)) return false;
  if (node.declarations.length !== 1) return false;
  if (node.kind !== 'const') return false;

  const decl = node.declarations[0];

  // 左边必须是标识符（不是解构）
  if (!t.isIdentifier(decl.id)) return false;

  // 右边必须是 await 表达式
  if (!t.isAwaitExpression(decl.init)) return false;

  const awaitArg = decl.init.argument;

  // 必须是一个 CallExpression
  if (!t.isCallExpression(awaitArg)) return false;

  const callee = awaitArg.callee;

  // 检查是否是 MemberExpression
  if (!t.isMemberExpression(callee)) return false;
  if (!t.isIdentifier(callee.property)) return false;

  const methodName = callee.property.name;

  // 方法名必须以 'forResult' 开头，且后面有后缀（zzz 不为空）
  if (!methodName.startsWith('forResult')) return false;

  // 确保 forResult 后面有后缀（即方法名不等于 'forResult'）
  if (methodName === 'forResult') return false;

  return true;
}

/**
 * 转换目标语句:
 * const xxx = await yyy().forResultzzz(); 
 * -> const { xxx } = await yyy().forResult();
 */
function transformTargetStatement(node) {
  const decl = node.declarations[0];
  const variableName = decl.id.name;

  const awaitExpr = decl.init;
  const originalCall = awaitExpr.argument;

  // 获取原始调用链: yyy().forResultzzz()
  const callee = originalCall.callee;
  const objectExpr = callee.object;

  // 构建新的调用: yyy().forResult()
  const forResultCall = t.callExpression(
    t.memberExpression(
      objectExpr,
      t.identifier('forResult') // 固定为 forResult，不带后缀
    ),
    originalCall.arguments // 保留原始参数
  );

  // 构建 await yyy().forResult()
  const newAwaitExpr = t.awaitExpression(forResultCall);

  // 创建解构赋值: const { xxx } = await yyy().forResult()
  const newDecl = t.variableDeclarator(
    t.objectPattern([
    t.objectProperty(
      t.identifier(variableName),
      t.identifier(variableName),
      false, // computed
      true // shorthand
    )]
    ),
    newAwaitExpr
  );
  const newVarDecl = t.variableDeclaration('const', [newDecl]);

  // 保留原语句的注释
  newVarDecl.leadingComments = node.leadingComments;
  newVarDecl.trailingComments = node.trailingComments;

  return newVarDecl;
}

/**
 * 在 AST 中处理语句
 */
function processStatements(ast) {
  const statementsToReplace = [];

  traverse(ast, {
    enter(path) {
      const node = path.node;

      // 如果是独立语句且匹配目标模式
      if (isStandaloneStatement(node) && isTargetPattern(node)) {
        statementsToReplace.push({
          path: path,
          node: node
        });
      }
    }
  });

  // 执行替换
  for (const { path, node } of statementsToReplace) {
    const newVarDecl = transformTargetStatement(node);
    path.replaceWith(newVarDecl);
  }
}

/**
 * 递归遍历目录,处理所有 JS 文件
 */
async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
        await processFile(fullPath);
      }
    }
  }
}

/**
 * 处理单个 JS 文件
 */
async function processFile(fullPath) {
  console.log(`Processing: ${fullPath}`);
  const code = fs.readFileSync(fullPath, 'utf8');

  try {
    // 解析为 AST
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
      'classProperties',
      'objectRestSpread',
      'dynamicImport',
      'optionalChaining',
      'nullishCoalescingOperator']

    });

    // 处理目标语句
    processStatements(ast);

    // 生成新代码
    const output = generate(ast, {
      retainLines: true,
      compact: false,
      comments: true
    }, code);

    // 写回文件
    fs.writeFileSync(fullPath, output.code, 'utf8');
  } catch (err) {
    console.warn(`Error processing ${fullPath}:`, err.message);
  }
}

// ---- 入口 ----
const targetDir = process.cwd();

console.log(`开始处理目录: ${targetDir}`);
processDirectory(targetDir).
then(() => console.log('处理完成!')).
catch((err) => console.warn('发生错误:', err));