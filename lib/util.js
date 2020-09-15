function findChild(node, type) {
    if (node == null) { throw new Error('cannot findChild() on null') }
    let result = []
    for (let child of node.children) {
        if (child.type == type) {
            result.push(child)
        }
    }
    if (result.length == 1) {
        return result[0]
    } else {
        return null
    }
}

function getPatternNode(node) {
    if (node.type == 'block') {
        let block = node
        let binding_node = findChild(block, 'binding')
        let pattern_node = findChild(binding_node, 'pattern')
        return pattern_node
    } else if (node.type == 'lambda') {
        let lambda = node
        let pattern_node = findChild(lambda, 'pattern')
        return pattern_node
    } else if (node.type == 'cps') {
        let cps = node
        let cps_binding = findChild(cps, 'cps_binding')
        if (cps_binding != null) {
            let pattern_node = findChild(cps_binding, 'pattern')
            return pattern_node
        } else {
            return null
        }
    } else {
        return null
    }
}

function patternToBindingNodes(pattern) {
    if (pattern == null) { throw new Error('cannot patternToBindings() on null') }
    let concrete = pattern.children[0]
    if (concrete.type == 'pattern_trivial') {
        return [concrete.children[0]]
    } else if (concrete.type == 'pattern_tuple') {
        return (
            concrete.children
            .filter(child => child.type == 'name')
        )
    } else if (concrete.type == 'pattern_bundle') {
        let result = []
        let prev = null
        for (let child of concrete.children) {
            if (child.type == 'name' && (prev == null || prev.type != ':')) {
                result.push(child)
            }
            prev = child
        }
        return result
    } else {
        return []
    }
}

module.exports.findChild = findChild
module.exports.getPatternNode = getPatternNode
module.exports.patternToBindingNodes = patternToBindingNodes