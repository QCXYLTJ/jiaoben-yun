// var-to-const-let.js
// 增强版：支持 var → const/let，且 let → const（如果未重新赋值）
module.exports = function (fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // 收集所有被重新赋值或更新的变量名（包括 =, ++, += 等）
    const reassignedVariables = new Set();

    // 1. AssignmentExpression: x = 1, x += 1, x -= 1 等
    root.find(j.AssignmentExpression).forEach((path) => {
        const node = path.node;
        if (node.left.type === 'Identifier') {
            reassignedVariables.add(node.left.name);
        }
    });

    // 2. UpdateExpression: i++, i--, ++i, --i
    root.find(j.UpdateExpression).forEach((path) => {
        const node = path.node;
        if (node.argument.type === 'Identifier') {
            reassignedVariables.add(node.argument.name);
        }
    });

    // 3. ForStatement 中的 i++ 等也已由上面覆盖

    // 转换所有 var 声明
    root.find(j.VariableDeclaration, { kind: 'var' }).forEach((path) => {
        const decl = path.node;
        let shouldUseLet = false;

        for (const declarator of decl.declarations) {
            if (declarator.id.type === 'Identifier' && reassignedVariables.has(declarator.id.name)) {
                shouldUseLet = true;
                break;
            }
        }

        decl.kind = shouldUseLet ? 'let' : 'const';
    });

    // 新增：转换所有 let 声明 → const（如果未被重新赋值）
    root.find(j.VariableDeclaration, { kind: 'let' }).forEach((path) => {
        const decl = path.node;
        let shouldStayLet = false;

        for (const declarator of decl.declarations) {
            if (declarator.id.type === 'Identifier' && reassignedVariables.has(declarator.id.name)) {
                shouldStayLet = true;
                break;
            }
        }

        // 如果从未被重新赋值，则改为 const
        if (!shouldStayLet) {
            decl.kind = 'const';
        }
    });

    return root.toSource();
};
