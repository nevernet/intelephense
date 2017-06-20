import { NameResolverVisitor } from './nameResolverVisitor';
import { TreeVisitor, MultiVisitor } from './types';
import { ParsedDocument } from './parsedDocument';
import { Phrase, Token, FunctionDeclarationHeader, TypeDeclaration, ParameterDeclaration, ConstElement, FunctionDeclaration, ClassDeclaration, ClassDeclarationHeader, ClassBaseClause, ClassInterfaceClause, QualifiedNameList, InterfaceDeclaration, InterfaceDeclarationHeader, InterfaceBaseClause, TraitDeclaration, TraitDeclarationHeader, ClassConstDeclaration, ClassConstElement, Identifier, MethodDeclaration, MethodDeclarationHeader, PropertyDeclaration, PropertyElement, MemberModifierList, NamespaceDefinition, NamespaceUseClause, AnonymousClassDeclaration, AnonymousFunctionCreationExpression, AnonymousFunctionUseVariable, TraitUseClause, SimpleVariable, FunctionCallExpression, ArgumentExpressionList } from 'php7parser';
import { PhpDoc, Tag, MethodTagParam } from './phpDoc';
import { PhpSymbol, SymbolKind, SymbolModifier } from './symbol';
import { NameResolver } from './nameResolver';
import { Location } from 'vscode-languageserver-types';
export declare class SymbolReader extends MultiVisitor<Phrase | Token> {
    private _symbolVisitor;
    constructor(nameResolverVisitor: NameResolverVisitor, symbolVisitor: SymbolVisitor);
    externalOnly: boolean;
    readonly spine: PhpSymbol[];
    static create(document: ParsedDocument, nameResolver: NameResolver, spine: PhpSymbol[]): SymbolReader;
}
export declare class SymbolVisitor implements TreeVisitor<Phrase | Token> {
    document: ParsedDocument;
    nameResolver: NameResolver;
    spine: PhpSymbol[];
    private static _varAncestors;
    private static _builtInTypes;
    private static _globalVars;
    lastPhpDoc: PhpDoc;
    lastPhpDocLocation: Location;
    namespaceUseDeclarationKind: SymbolKind;
    namespaceUseDeclarationPrefix: string;
    classConstDeclarationModifier: SymbolModifier;
    propertyDeclarationModifier: SymbolModifier;
    externalOnly: boolean;
    constructor(document: ParsedDocument, nameResolver: NameResolver, spine: PhpSymbol[]);
    preorder(node: Phrase | Token, spine: (Phrase | Token)[]): boolean;
    postorder(node: Phrase | Token, spine: (Phrase | Token)[]): void;
    private _tokenToSymbolKind(t);
    private _shouldReadVar(spine);
    private _top();
    private _variableExists(name);
    private _token(t);
    private _addSymbol(symbol, pushToSpine);
    argListToStringArray(node: ArgumentExpressionList): string[];
    functionCallExpression(node: FunctionCallExpression): PhpSymbol;
    nameTokenToFqn(t: Token): string;
    functionDeclaration(node: FunctionDeclaration, phpDoc: PhpDoc): PhpSymbol;
    functionDeclarationHeader(s: PhpSymbol, node: FunctionDeclarationHeader): PhpSymbol;
    parameterDeclaration(node: ParameterDeclaration, phpDoc: PhpDoc): PhpSymbol;
    typeDeclaration(node: TypeDeclaration): string;
    private _namePhraseToFqn(node, kind);
    constElement(node: ConstElement, phpDoc: PhpDoc): PhpSymbol;
    classConstantDeclaration(node: ClassConstDeclaration): SymbolModifier;
    classConstElement(modifiers: SymbolModifier, node: ClassConstElement, phpDoc: PhpDoc): PhpSymbol;
    methodDeclaration(node: MethodDeclaration, phpDoc: PhpDoc): PhpSymbol;
    memberModifierList(node: MemberModifierList): SymbolModifier;
    methodDeclarationHeader(s: PhpSymbol, node: MethodDeclarationHeader): PhpSymbol;
    propertyDeclaration(node: PropertyDeclaration): SymbolModifier;
    propertyElement(modifiers: SymbolModifier, node: PropertyElement, phpDoc: PhpDoc): PhpSymbol;
    identifier(node: Identifier): string;
    interfaceDeclaration(node: InterfaceDeclaration, phpDoc: PhpDoc, phpDocLoc: Location): PhpSymbol;
    phpDocMembers(phpDoc: PhpDoc, phpDocLoc: Location): PhpSymbol[];
    methodTagToSymbol(tag: Tag, phpDocLoc: Location): PhpSymbol;
    magicMethodParameterToSymbol(p: MethodTagParam, phpDocLoc: Location): PhpSymbol;
    propertyTagToSymbol(t: Tag, phpDocLoc: Location): PhpSymbol;
    magicPropertyModifier(t: Tag): SymbolModifier;
    interfaceDeclarationHeader(s: PhpSymbol, node: InterfaceDeclarationHeader): PhpSymbol;
    interfaceBaseClause(node: InterfaceBaseClause): PhpSymbol[];
    traitDeclaration(node: TraitDeclaration, phpDoc: PhpDoc, phpDocLoc: Location): PhpSymbol;
    traitDeclarationHeader(node: TraitDeclarationHeader): string;
    classDeclaration(node: ClassDeclaration, phpDoc: PhpDoc, phpDocLoc: Location): PhpSymbol;
    classDeclarationHeader(s: PhpSymbol, node: ClassDeclarationHeader): PhpSymbol;
    classBaseClause(node: ClassBaseClause): PhpSymbol;
    stringToInterfaceSymbolStub(text: string): PhpSymbol;
    classInterfaceClause(node: ClassInterfaceClause): PhpSymbol[];
    stringToTraitSymbolStub(text: string): PhpSymbol;
    traitUseClause(node: TraitUseClause): PhpSymbol[];
    anonymousClassDeclaration(node: AnonymousClassDeclaration): PhpSymbol;
    anonymousFunctionCreationExpression(node: AnonymousFunctionCreationExpression): PhpSymbol;
    anonymousFunctionUseVariable(node: AnonymousFunctionUseVariable): PhpSymbol;
    simpleVariable(node: SimpleVariable): PhpSymbol;
    qualifiedNameList(node: QualifiedNameList): string[];
    namespaceUseClause(node: NamespaceUseClause, kind: SymbolKind, prefix: string): PhpSymbol;
    namespaceDefinition(node: NamespaceDefinition): PhpSymbol;
}
export declare namespace SymbolReader {
    function modifierListElementsToSymbolModifier(tokens: Token[]): SymbolModifier;
    function modifierTokenToSymbolModifier(t: Token): SymbolModifier;
}
