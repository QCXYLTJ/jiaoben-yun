module.exports = function (fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    function isSameNode(a, b) {
        if (!a || !b) return false;
        if (a.type !== b.type) return false;
        if (a.type === 'Identifier') {
            return a.name === b.name;
        }
        if (a.type === 'MemberExpression') {
            return isSameNode(a.object, b.object) && isSameNode(a.property, b.property);
        }
        return false;
    }

    root.find(j.ForStatement).forEach((forPath) => {
        const { init, test, update, body } = forPath.node;

        if (!init || init.type !== 'VariableDeclaration' || init.declarations.length !== 1) return;
        const decl = init.declarations[0];
        if (decl.id.type !== 'Identifier') return;
        if (!decl.init || decl.init.type !== 'Literal' || decl.init.value !== 0) return;
        const varName = decl.id.name;

        if (!test || test.type !== 'BinaryExpression' || test.operator !== '<') return;
        if (test.left.type !== 'Identifier' || test.left.name !== varName) return;
        if (test.right.type !== 'MemberExpression' ||
            test.right.property.type !== 'Identifier' ||
            test.right.property.name !== 'length') return;
        const arrayExpr = test.right.object;

        if (!update || update.type !== 'UpdateExpression' || update.operator !== '++') return;
        if (update.argument.type !== 'Identifier' || update.argument.name !== varName) return;

        let hasValidAccess = false;
        let hasInvalidUse = false;
        let hasLeftSideModification = false;

        const varRefs = j(body).find(j.Identifier, { name: varName });

        varRefs.forEach((refPath) => {
            const parent = refPath.parent;
            if (parent && parent.node.type === 'MemberExpression' && parent.node.property === refPath.node) {
                if (isSameNode(parent.node.object, arrayExpr)) {
                    hasValidAccess = true;
                    // 检查该 MemberExpression 是否出现在赋值或更新的左侧
                    const grandParent = parent.parent;
                    if (grandParent) {
                        // 赋值表达式左侧
                        if (grandParent.node.type === 'AssignmentExpression' &&
                            grandParent.node.left === parent.node) {
                            hasLeftSideModification = true;
                        }
                        // 更新表达式（++/--）
                        if (grandParent.node.type === 'UpdateExpression' &&
                            grandParent.node.argument === parent.node) {
                            hasLeftSideModification = true;
                        }
                    }
                } else {
                    hasInvalidUse = true;
                }
            } else {
                hasInvalidUse = true;
            }
        });

        if (!hasValidAccess || hasInvalidUse || hasLeftSideModification) return;

        // 安全转换：替换所有 list[i] 为 i
        j(body).find(j.MemberExpression, {
            property: { type: 'Identifier', name: varName }
        }).forEach((memPath) => {
            if (isSameNode(memPath.node.object, arrayExpr)) {
                memPath.replace(j.identifier(varName));
            }
        });

        const left = j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(varName))
        ]);
        const newFor = j.forOfStatement(left, arrayExpr, body);
        forPath.replace(newFor);
    });

    return root.toSource().trim();
};