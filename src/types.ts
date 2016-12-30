/* Copyright © Ben Mewburn ben@mewburn.id.au
 * Licensed under the MIT Licence.
 */

'use strict';

export interface Position {
    line: number;
    char: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface Predicate<T> {
    (t: T): boolean;
}

export interface DebugLogger {
    debug(message: string): void;
}

export interface EventHandler<T> {
    (t: T): void;
}

export class Event<T> {

    private _subscribed: EventHandler<T>[];

    constructor() {
        this._subscribed = [];
    }

    subscribe(handler: EventHandler<T>) {
        this._subscribed.push(handler);
        let index = this._subscribed.length - 1;
        let subscribed = this._subscribed;
        return () => {
            subscribed.splice(index, 1);
        };
    }

    trigger(args: T) {
        let handler: EventHandler<T>;
        for (let n = 0; n < this._subscribed.length; ++n) {
            handler = this._subscribed[n];
            handler(args);
        }
    }

}

export interface TreeVisitor<T> {

    haltTraverse?: Event<null>;
    preOrder?(t: Tree<T>): boolean;
    inOrder?(t: Tree<T>, afterChildIndex: number): void;
    postOrder?(t: Tree<T>): void;

}

export class Debounce<T> {

    private _handler: (e: T) => void;
    private _lastEvent: T;
    private _timer: number;
    private _wait: number;

    constructor(handler: (e: T) => void, wait: number) {
        this._handler = handler;
        this._wait = wait;
    }

    handle(event: T) {
        this._lastEvent = event;
        this.interupt();
        let later = () => {
            this._handler.apply(this, this._lastEvent);
        };
        this._timer = setTimeout(later, this._wait);
    }

    interupt() {
        clearTimeout(this._timer);
        this._timer = 0;
    }

    flush() {
        if (this._timer) {
            this.interupt();
            this._handler.apply(this, this._lastEvent);
        }
    }

}

export class Tree<T> {

    private _children: Tree<T>[];
    private _value: T;

    parent: Tree<T>;

    constructor(value: T) {
        this._value = value;
        this._children = [];
    }

    get value() {
        return this._value;
    }

    get children() {
        return this._children;
    }

    child(n: number) {
        return n < this._children.length ? this._children[n] : null;
    }

    addChild(child: Tree<T>) {
        this._children.push(child);
        child.parent = this;
        return child;
    }

    addChildren(children: Tree<T>[]) {
        for (let n = 0; n < children.length; ++n) {
            this.addChild(children[n]);
        }
    }

    removeChild(child: Tree<T>) {
        let i = this._children.indexOf(child);
        if (i !== -1) {
            child.parent = null;
            return this._children.splice(i, 1)[0];
        }
        return null;
    }

    /**
     * Pre-order flatten of tree
     */
    toArray() {
        let visitor = new ToArrayVisitor<T>();
        this.traverse(visitor);
        return visitor.array;
    }

    toString() {
        return this._value !== undefined && this._value !== null ? this._value.toString() : '';
    }

    find(predicate: Predicate<Tree<T>>) {

        let node: Tree<T>;
        let visitor: BreadthFirstTreeVisitor<T> = (x) => {
            if (predicate(x)) {
                node = x;
                return false;
            }
            return true;
        };
        this.breadthFirstTraverse(visitor);
        return node;

    }

    match(predicate: Predicate<Tree<T>>) {

        let visitor = new FilterVisitor<T>(predicate);
        this.traverse(visitor);
        return visitor.array;

    }

    traverse(visitor: TreeVisitor<T>) {

        let descend: boolean = false;

        if (visitor.hasOwnProperty('preOrder')) {
            descend = visitor.preOrder(this);
        }

        if (this._children.length && descend) {

            for (let n = 0, l = this._children.length; n < l; ++n) {
                this._children[n].traverse(visitor);
            }

        }

        if (visitor.hasOwnProperty('postOrder')) {
            visitor.postOrder(this);
        }

    }

    breadthFirstTraverse(breadthFirstVisitor: BreadthFirstTreeVisitor<T>) {

        let stack: Tree<T>[] = [this];
        let node: Tree<T>;

        while (stack.length > 0) {

            node = stack.shift();
            if (!breadthFirstVisitor(node)) {
                break;
            }

            if (node.children) {
                Array.prototype.push.apply(stack, node.children);
            }

        }

    }

    previousSibling() {
        let parent = this.parent;
        if (!parent) {
            return null;
        }
        let i = parent.children.indexOf(this);
        return i > 0 ? parent.children[i] : null;
    }

    ancestor(predicate: Predicate<Tree<T>>) {

        let ancestor = this as Tree<T>;
        while ((ancestor = ancestor.parent)) {
            if (predicate(ancestor)) {
                break;
            }
        }

        return ancestor;
    }

}

export interface BreadthFirstTreeVisitor<T> {
    (node: Tree<T>): boolean;
}

class FilterVisitor<T> implements TreeVisitor<T>{

    private _predicate: Predicate<Tree<T>>;
    private _array: Tree<T>[];

    constructor(predicate: Predicate<Tree<T>>) {
        this._predicate = predicate;
        this._array = [];
    }

    get array() {
        return this._array;
    }

    preOrder(node: Tree<T>) {
        if (this._predicate(node)) {
            this._array.push(node);
        }
        return true;
    }

}

class ToArrayVisitor<T> implements TreeVisitor<T>{

    private _array: T[];

    constructor() {
        this._array = [];
    }

    get array() {
        return this._array;
    }

    preOrder(t) {
        this._array.push(t.value);
        return true;
    }

}

class MultiVisitor<T> implements TreeVisitor<T> {

    private _visitors: [TreeVisitor<T>, Tree<T>][];

    constructor(visitors: TreeVisitor<T>[] = []) {
        for (let n = 0; n < visitors.length; ++n) {
            this.add(visitors[n]);
        }
    }

    add(v: TreeVisitor<T>) {
        this._visitors.push([v, null]);
    }

    preOrder(t) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (!v[1]) {
                v[0].preOrder(t);
            }
        }
    }

    inOrder(t, afterChildIndex) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (!v[1]) {
                v[0].inOrder(t, afterChildIndex);
            }
        }
    }

    postOrder(t) {
        let v: [TreeVisitor<T>, Tree<T>];
        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (v[1] === t) {
                v[1] = null;
            }
            if (!v[1]) {
                v[0].postOrder(t);
            }
        }
    }

    shouldDescend(t) {

        let v: [TreeVisitor<T>, Tree<T>];
        let descend = false;

        for (let n = 0; n < this._visitors.length; ++n) {
            v = this._visitors[n];
            if (v[1]) {
                continue;
            }
            if (v[0].shouldDescend(t)) {
                descend = true;
            } else {
                v[1] = t;
            }
        }

        return descend;

    }


}

export class BinarySearch<T> {

    private _sortedArray: T[];

    constructor(sortedArray: T[]) {
        this._sortedArray = sortedArray;
    }

    find(compare: (n: T) => number) {
        let result = this._search(compare);
        return result.isExactMatch ? this._sortedArray[result.rank] : null;
    }

    rank(compare: (n: T) => number) {
        return this._search(compare).rank;
    }

    range(compareLower: (n: T) => number, compareUpper: (T) => number) {
        let rankLower = this.rank(compareLower);
        return this._sortedArray.slice(rankLower, this._search(compareUpper, rankLower + 1).rank);
    }

    private _search(compare: (n: T) => number, left = 0): BinarySearchResult {

        let right = this._sortedArray.length - 1;
        let mid = 0;
        let compareResult = 0;
        let searchResult: BinarySearchResult;

        while (true) {

            if (left > right) {
                searchResult = { rank: left, isExactMatch: false };
                break;
            }

            mid = Math.floor((left + right) / 2);
            compareResult = compare(this._sortedArray[mid]);

            if (compareResult < 0) {
                left = mid + 1;
            } else if (compareResult > 0) {
                right = mid - 1;
            } else {
                searchResult = { rank: mid, isExactMatch: true };
                break;
            }

        }

        return searchResult;

    }

}

interface BinarySearchResult {
    rank: number;
    isExactMatch: boolean
}

interface SuffixDelegate<T> {
    (t: T): string[];
}

export class SuffixArray<T> {

    private _nodeArray: SuffixArrayNode<T>[];
    private _binarySearch: BinarySearch<SuffixArrayNode<T>>;
    private _collator: Intl.Collator;
    private _suffixDelegate: SuffixDelegate<T>;
    private _caseSensitive: boolean;

    constructor(suffixDelegate: SuffixDelegate<T>, caseSensitive = true) {
        this._nodeArray = [];
        this._binarySearch = new BinarySearch<SuffixArrayNode<T>>(this._nodeArray);
        this._collator = new Intl.Collator();
        this._suffixDelegate = suffixDelegate;
        this._caseSensitive = caseSensitive;
    }

    add(item: T) {

        let suffixes = this._suffixDelegate(item);
        let node: SuffixArrayNode<T>;

        for (let n = 0; n < suffixes.length; ++n) {

            node = this._nodeFind(suffixes[n]);

            if (node) {
                node.items.push(item);
            } else {
                this._insertNode({ key: suffixes[n], items: [item] });
            }
        }

    }

    addMany(items: T[]) {
        for (let n = 0; n < items.length; ++n) {
            this.add(items[n]);
        }
    }

    remove(item: T) {

        let suffixes = this._suffixDelegate(item);
        let node: SuffixArrayNode<T>;
        let i: number;

        for (let n = 0; n < suffixes.length; ++n) {

            node = this._nodeFind(suffixes[n]);
            if (!node) {
                continue;
            }

            i = node.items.indexOf(item);

            if (i !== -1) {
                node.items.splice(i, 1);
                if (!node.items.length) {
                    this._deleteNode(node);
                }
            }

        }

    }

    removeMany(items: T[]) {
        for (let n = 0; n < items.length; ++n) {
            this.remove(items[n]);
        }
    }


    match(text: string) {

        let nodes = this._nodeMatch(text);
        let matches: Set<T> = new Set<T>();

        for (let n = 0; n < nodes.length; ++n) {
            Set.prototype.add.apply(matches, nodes[n].items);
        }

        return Array.from(matches);

    }

    private _nodeMatch(text: string) {

        let collator = this._collator;
        let lcText = this._caseSensitive ? text : text.toLowerCase();

        return this._binarySearch.range(
            (n: SuffixArrayNode<T>) => {
                return collator.compare(lcText, n.key);
            },
            (n: SuffixArrayNode<T>) => {
                return n.key.slice(0, lcText.length) === lcText ? 1 : -1;
            }
        );

    }

    private _nodeFind(text: string) {

        let lcText = this._caseSensitive ? text : text.toLowerCase();
        let collator = this._collator;

        return this._binarySearch.find((n) => {
            return collator.compare(lcText, n.key);
        });

    }

    private _insertNode(node: SuffixArrayNode<T>) {

        let collator = this._collator;
        let rank = this._binarySearch.rank((n) => {
            return collator.compare(node.key, n.key);
        });

        this._nodeArray.splice(rank, 0, node);

    }

    private _deleteNode(node: SuffixArrayNode<T>) {

        let collator = this._collator;
        let rank = this._binarySearch.rank((n) => {
            return collator.compare(node.key, n.key);
        });

        if (this._nodeArray[rank] === node) {
            this._nodeArray.splice(rank, 1);
        }

    }

}

interface SuffixArrayNode<T> {
    key: string;
    items: T[];
}
