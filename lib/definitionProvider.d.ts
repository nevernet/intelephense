import * as lsp from 'vscode-languageserver-types';
import { SymbolStore } from './symbol';
import { ParsedDocumentStore } from './parsedDocument';
export declare class DefinitionProvider {
    symbolStore: SymbolStore;
    documentStore: ParsedDocumentStore;
    constructor(symbolStore: SymbolStore, documentStore: ParsedDocumentStore);
    provideDefinition(uri: string, position: lsp.Position): lsp.Location;
    private _lookupSymbol(traverser, context);
    private _hasLocation(s);
    private _qualifiedName(traverser, context);
    private _scopedMemberName(traverser, context);
    private _memberName(traverser, context);
    private _simpleVariable(traverser, context);
}