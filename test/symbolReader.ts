import { PhpSymbol, SymbolKind, SymbolModifier } from '../src/symbol';
import { SymbolTable } from '../src/symbolStore';
import { NameResolver } from '../src/nameResolver';
import { SymbolReader } from '../src/symbolReader';
import { ParsedDocument } from '../src/parsedDocument';
import { assert } from 'chai';
import 'mocha';

function symbolReaderOutput(src: string) {

    let parsedDoc = new ParsedDocument('test', src);
    let symbolTree: PhpSymbol = { kind: SymbolKind.None, name: '' };
    let sr = new SymbolReader(parsedDoc, new NameResolver(), [symbolTree]);
    parsedDoc.traverse(sr);
    return symbolTree;

}

describe('SymbolReader', () => {

    it('@method tags', function(){
        let src = `<?php
            /**
             * @method int fn(string $p) method description
             */
            class Foo { }`;

            let symbols = symbolReaderOutput(src);
            let method = symbols.children[0].children[0];
            let param = method.children[0];

            assert.equal(method.kind, SymbolKind.Method);
            assert.equal(method.modifiers, SymbolModifier.Magic);
            assert.equal(method.name, 'fn');
            assert.equal(method.type.toString(), 'int');
            assert.equal(param.kind, SymbolKind.Parameter);
            assert.equal(param.name, '$p');
            assert.equal(param.type.toString(), 'string');

            //console.log(JSON.stringify(symbols, null, 4));
    });


    it('namespace use parse error', function () {

        let src =
            `<?php
            use
        `;

        assert.doesNotThrow(() => { symbolReaderOutput(src) });

    });

    it('namespace, use, class, trait', function () {

        let src =
            `<?php
            namespace Wat;

            use Foo\\Baz;
            class Bar {
                use Baz;
            }
        `;
        let output = symbolReaderOutput(src);
        assert.equal(output.children[0].kind, SymbolKind.Namespace);
        assert.equal(output.children[0].name, 'Wat');
        assert.equal(output.children[1].kind, SymbolKind.Class);
        assert.equal(output.children[1].name, 'Baz');
        assert.equal(output.children[2].kind, SymbolKind.Class);
        assert.equal(output.children[2].name, 'Wat\\Bar');
        assert.deepEqual(output.children[2].associated[0], { kind: SymbolKind.Trait, name: 'Foo\\Baz' });
    });

    it('Should read simple variables', () => {
        let src = `<?php 
                        $myVar = 1;
                        
                        function myFunction($myParam){}`;
        let output = symbolReaderOutput(src);
        //console.log(JSON.stringify(output, null, 4));
    });

    it('Should assign phpdoc info', () => {

        let src = `
        <?php

            /**
             * Summary.
             * Description.
             * @param int $param description
             * @return string
             */
            function fn($param){}
        `;

        let output = symbolReaderOutput(src);
        //console.log(JSON.stringify(output, null, 4));

    });
});