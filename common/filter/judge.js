let replaceRegExp = {}

module.exports = (ifText, replaceValue) => {
    if (typeof ifText != 'string') {
        ifText = ''
    }
    let origin = ifText

    // 正規表現の抜き出し
    replaceRegExp = {}
    let regList = ifText.match(/\/[^/]+\//g)
    if (Array.isArray(regList)) {
        regList.forEach((reg, i) => {
            ifText = ifText.replace(reg, '\\\\' + i)
            replaceRegExp['\\\\' + i] = reg
        })
    }

    ifText = textReplace(ifText)

    if (typeof ifText != 'string') {
        ifText = String(ifText)
    }
    let lis = {
        valueName: []
    }
    let value = separateParenthesis(lis, ifText)
    let truth = andOr(lis, value)
    if (replaceValue != null && typeof replaceValue == 'object' && !Array.isArray(replaceValue)) {
        for (let i = 0; i < lis.valueName.length; i++) {
            if (lis.valueName[i] in replaceValue) {
                let a = lis.valueName[i]
                ifText = ifText.replace(a, replaceValue[a])
            }
        }
        value = separateParenthesis(lis, ifText)
        truth = andOr(lis, value)
    }
    if (truth === true || truth === 'true') {
        return {
            judge: true,
            value: lis.valueName,
            origin: origin
        }
    } else {
        return {
            judge: false,
            value: lis.valueName,
            origin: origin
        }
    }
}


const textReplace = (text) => {

    // 配列は　&&　でつなげる
    if (text instanceof Array) {
        let t = '('
        let len = text.length
        text.forEach((txt, i) => {
            t += txt + ' )'
            if (i != len - 1) {
                t += ' && ('
            }
        })
        text = t.trim()
    }

    text = text.toString()
    text = text.trim()
    //　特殊記号を置き換え
    text = text.replace(/&(gt|lt|#039|quot|amp);/ig, function($0, $1) {
        if (/^gt$/i.test($1)) return ">";
        if (/^lt$/i.test($1)) return "<";
        if (/^amp$/i.test($1)) return "&";
    })

    return text
}


function separateParenthesis(lis, value) {
    if (typeof value == 'boolean') {
        return value
    }
    if (/^\/.+\//.test(value)) {
        return value
    }
    let match = value.match(/[(].+[)]/g)
    if (match != null) {
        let i = 0,
            len = match.length
        for (; i < len; i++) {
            let trans
            trans = match[i].replace('(', '')
            trans = trans.replace(')', '')
            let match2 = trans.match(/[(].+[)]/g)
            if (match2 != null) {
                trans = separateParenthesis(lis, trans)
            }
            let truth = andOr(lis, trans)
            value = value.replace(match[i], truth)
            //console.log('Parenthesis  '+value)
        }
        return value
    } else {
        return value
    }
}

/**
 * value = 'min > sec && sec == 10 || true'
 * separeteOr ['min > sec && sec == 10', 'true']
 * separeteAnd ['min > sec', 'sec == 10'] , ['true']
 * equal   (false && true) || true
 * return true
 */

function andOr(lis, value) {
    if (typeof value == 'boolean') {
        return value
    }
    //console.log(' andOr '+value)
    let values = separeteOr(value)
    //console.log(' sepOr '+values)
    // or
    let truth = false
    if (values instanceof Array) {
        let i = 0,
            len = values.length
        for (; i < len; i++) {
            //console.log(values[i])
            let sepAnd = separeteAnd(values[i])
            //console.log(' sepAnd  '+sepAnd)
            // and
            let itruth = and(lis, sepAnd)
            truth = truth || itruth
        }
        return truth
    } else {
        let sepAnd = separeteAnd(values)
        //console.log(' sepAnd  '+sepAnd)
        let truth = and(lis, sepAnd)
        return truth
    }
}

/**
 * value = 'min > sec && 4 < sec || sec == 10'
 * return ['min > sec  && 4 < sec', 'sec == 10']
 */

function separeteOr(value) {
    if (typeof value == 'boolean') {
        return value
    }
    if (value.indexOf('||') > 0) {
        let res = value.split('||')
        return res
    } else if (value.indexOf('|') > 0) {
        let res = value.split('|')
        return res
    } else if (value.indexOf('｜｜') > 0) {
        let res = value.split('｜｜')
        return res
    } else if (value.indexOf('｜') > 0) {
        let res = value.split('｜')
        return res
    }
    return value
}

/**
 * value = 'min > sec && sec == 10'
 * return ['min > sec', 'sec == 10']
 */

function separeteAnd(value) {
    if (typeof value == 'boolean') {
        return value
    }
    if (value.indexOf('&&') > 0) {
        let res = value.split('&&')
        return res
    } else if (value.indexOf('&') > 0) {
        let res = value.split('&')
        return res
    } else if (value.indexOf('＆＆') > 0) {
        let res = value.split('＆＆')
        return res
    } else if (value.indexOf('＆') > 0) {
        let res = value.split('＆')
        return res
    }
    return value
}

/**
 * value = ['A > B', 'C == D']
 * equal (sparete(A > B)) && equal (sparete(C == D))
 */

function and(lis, value) {
    if (typeof value == 'boolean') {
        return value
    }
    //console.log('   and  '+value)
    let truth = true
    if (value instanceof Array) {
        let i = 0,
            len = value.length
        for (; i < len; i++) {
            let sepOp = separeteOperant(value[i])
            //console.log('   sepOp  '+sepOp)
            let itruth = equal(lis, sepOp)
            truth = truth && itruth
        }
    } else {
        let sepOp = separeteOperant(value)
        //console.log('   sepOp  '+sepOp)
        truth = equal(lis, sepOp)
    }
    return truth
}

/**
 * value = ['A > B', 'C == D']
 * equal (sparete(A > B)) || equal (sparete(C == D))
 */

function or(lis, value) {
    if (typeof value == 'boolean') {
        return value
    }
    //console.log('   or  '+value)
    let truth = false
    if (value instanceof Array) {
        let i = 0,
            len = value.length
        for (; i < len; i++) {
            let sepOp = separeteOperant(value[i])
            //console.log('   sepOp  '+sepOp)
            let itruth = equal(lis, sepOp)
            truth = truth || itruth
        }
    } else {
        let sepOp = separeteOperant(value)
        //console.log('   sepOp  '+sepOp)
        truth = equal(lis, sepOp)
    }
    return truth
}

/**
 * value = 'A > B'
 * return ['A','B','>']
 */

function separeteOperant(value) {
    if (typeof value == 'boolean') {
        return value
    }
    if (value.indexOf('==') > 0) {
        let res = value.split('==')
        res.push('==')
        return res
    }
    if (value.indexOf('＝＝') > 0) {
        let res = value.split('＝＝')
        res.push('==')
        return res
    }
    if (value.indexOf('!=') > 0) {
        let res = value.split('!=')
        res.push('!=')
        return res
    }
    if (value.indexOf('！＝') > 0) {
        let res = value.split('！＝')
        res.push('!=')
        return res
    } else if (value.indexOf('>=') > 0) {
        let res = value.split('>=')
        res.push('>=')
        return res
    } else if (value.indexOf('＞＝') > 0) {
        let res = value.split('＞＝')
        res.push('>=')
        return res
    } else if (value.indexOf('<=') > 0) {
        let res = value.split('<=')
        res.push('<=')
        return res
    } else if (value.indexOf('＜＝') > 0) {
        let res = value.split('＜＝')
        res.push('<=')
        return res
    } else if (value.indexOf('<') > 0) {
        let res = value.split('<')
        res.push('<')
        return res
    } else if (value.indexOf('＜') > 0) {
        let res = value.split('＜')
        res.push('<')
        return res
    } else if (value.indexOf('>') > 0) {
        let res = value.split('>')
        res.push('>')
        return res
    } else if (value.indexOf('＞') > 0) {
        let res = value.split('＞')
        res.push('>')
        return res
    } else if (value.indexOf('=') > 0) {
        let res = value.split('=')
        res.push('=')
        return res
    } else if (value.indexOf('＝') > 0) {
        let res = value.split('＝')
        res.push('=')
        return res
    }
    return value
}

/**
 * value = [ A, B, >]
 */

function equal(lis, value) {
    //console.log('     equal '+value)
    if (value instanceof Array) {} else {
        if (value.trim() == 'true') {
            //console.log('     boolean '+true)
            return true
        } else if (value.trim() == 'false') {
            //console.log('     boolean '+true)
            return false
        } else {
            let v = culculate(lis, value)
            //console.log('     culculate '+v)
            return v
        }
    }
    if (value.length != 3) {
        if (value.length == 1) {
            let v = culculate(lis, value[0])
            //console.log('     culculate '+v)
            return v
        }
        return false
    }

    let a = value[0].trim()
    let b = value[1].trim()
    a = replaceRegExp[a] || a
    b = replaceRegExp[b] || b
    let op = value[2].trim()
    let aV = culculate(lis, a)
    let bV = culculate(lis, b)

    //console.log('     '+aV +', '+ op +', '+ bV)
    if (aV == null || bV == null) {
        return false
    } else if (op == '>') {
        //console.log('     boolean '+(parseFloat(aV) > parseFloat(bV)))
        return (parseFloat(aV) > parseFloat(bV))
    } else if (op == '<') {
        //console.log('     boolean '+(parseFloat(aV) < parseFloat(bV)))
        return (parseFloat(aV) < parseFloat(bV))
    } else if (op == '==') {
        //typeof aV == ''
        aV = Array.isArray(aV) ? aV.toString() : aV
        bV = Array.isArray(bV) ? bV.toString() : bV
        aV = typeof aV == 'object' ? 'object' : aV
        bV = typeof bV == 'object' ? 'object' : bV
        aV = typeof aV == 'function' ? 'function' : aV
        bV = typeof bV == 'function' ? 'function' : bV

        // RegExp

        let aMatch = typeof aV == 'string' ? aV.match(/^\/(.+)\//) : false
        let bMatch = typeof bV == 'string' ? bV.match(/^\/(.+)\//) : false
        if (aMatch && bMatch) {
            return (aV == bV)
        } else if (aMatch) {
            if (new RegExp(aMatch[1]).test(bV)) {
                return true
            }
            return false
        } else if (bMatch) {
            if (new RegExp(bMatch[1]).test(aV)) {
                return true
            }
            return false
        }
        return (aV == bV)
    } else if (op == '=') {
        //console.log('     boolean '+( aV == bV))
        return (aV == bV)
    } else if (op == '!=') {
        //console.log('     boolean '+( aV == bV))
        return (aV != bV)
    } else if (op == '>=') {
        //console.log('     boolean '+(parseFloat(aV) >= parseFloat(bV)))
        return (parseFloat(aV) >= parseFloat(bV))
    } else if (op == '<=') {
        //console.log('     boolean '+(parseFloat(aV) <= parseFloat(bV)))
        return (parseFloat(aV) <= parseFloat(bV))
    } else {
        //console.log('     error '+false)
        return false
    }
}

/**
 * % + - * /
 */

function culculate(lis, text) {
    text = text.trim()
    if (text.length < 2) {
        lis.valueName.push(text)
        return text
    }
    let index = text.indexOf('%')
    if (index > 0) return culculate2(lis, text, index, '%');

    index = text.indexOf('+')
    if (index == 0) return culculate(lis, text.slice(1)) * 1;
    if (index > 0) return culculate2(lis, text, index, '+');

    index = text.indexOf('-')
    if (index == 0) return culculate(lis, text.slice(1)) * -1;
    if (index > 0) return culculate2(lis, text, index, '-');

    index = text.indexOf('*')
    if (index > 0) return culculate2(lis, text, index, '*');

    index = text.indexOf('/')
    if (index > 0) return culculate2(lis, text, index, '/');

    lis.valueName.push(text)
    return text
}

function culculate2(lis, text, index, op) {
    let split1 = text.slice(0, index).trim()
    let split2 = text.slice(index + 1).trim()
    let index1 = split1.indexOf('%') + split1.indexOf('+') + split1.indexOf('-') + split1.indexOf('*') + split1.indexOf('/')
    let index2 = split2.indexOf('%') + split2.indexOf('+') + split2.indexOf('-') + split2.indexOf('*') + split2.indexOf('/')


    if (index1 > -5) {
        split1 = culculate(lis, split1)
        if (typeof split1 == 'boolean') return split1
    }
    if (index2 > -5) {
        split2 = culculate(lis, split2)
        if (typeof split2 == 'boolean') return split1
    }
    lis.valueName.push(split1)
    lis.valueName.push(split2)
    if (op == '%') {
        return parseFloat(split1) % parseFloat(split2)
    } else if (op == '+') {
        if (isNaN(split1) || isNaN(split2)) { // 数値でないものを含む
            let append = split1 + split2
            lis.valueName.push(append)
            return append
        }
        return parseFloat(split1) + parseFloat(split2)
    } else if (op == '-') {
        return parseFloat(split1) - parseFloat(split2)
    } else if (op == '*') {
        return parseFloat(split1) * parseFloat(split2)
    } else if (op == '/') {
        if (split2 == 0) return false;
        return parseFloat(split1) / parseFloat(split2)
    } else {
        return false
    }
}
