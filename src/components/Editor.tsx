import { MonacoEditor } from "solid-monaco";

type EditorProps = {
  type: "cpu" | "gpu",
  value: string,
  onChange: (value: string)=>void
}

export default function Editor(props: EditorProps) {
  return (
    <MonacoEditor
      language='lua'
      width='100%'
      height='60vh' 
      value={props.value} 
      onChange={props.onChange}
      options={{
        minimap: {enabled: false},
        fontSize: 18,
      }}
    onMount={(monaco, _editor)=> {
      monaco.editor.setTheme('vs-dark')
      monaco.languages.registerCompletionItemProvider('lua', {
        provideCompletionItems: (_model, position) => {
            const globals = [
                'math', 'string', 'table', 'pairs', 'ipairs', 'print',
                'WIDTH', 'HEIGHT'
            ]
            const suggestions = globals.map(label => ({
                label,
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: label,
                range: new monaco.Range(
                    position.lineNumber,
                    position.column - 1, 
                    position.lineNumber,
                    position.column
                )
            }));
            // api
            if (props.type === 'cpu')  {
              suggestions.push({
                label: 'set_colour_at_position',
                kind: monaco.languages.CompletionItemKind.Function,
                range: new monaco.Range(
                    position.lineNumber,
                    position.column - 1,
                    position.lineNumber,
                    position.column
                ),
                insertText: 'set_colour_at_position({${1:r}, ${2:g}, ${3:b}}, {${4:x}, ${5:y}})',
                /* @ts-ignore */
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              })
            }
            else {
              suggestions.push({
                label: 'set_colour',
                kind: monaco.languages.CompletionItemKind.Function,
                range: new monaco.Range(
                    position.lineNumber,
                    position.column - 1,
                    position.lineNumber,
                    position.column
                ),
                insertText: 'set_colour({${1:r}, ${2:g}, ${3:b}})',
                /* @ts-ignore */
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              })
              suggestions.push({
                label: 'get_position',
                kind: monaco.languages.CompletionItemKind.Function,
                range: new monaco.Range(
                    position.lineNumber, 
                    position.column - 1,
                    position.lineNumber,
                    position.column
                ),
                insertText: 'get_position',
              })
            }
            return { suggestions };
        },
        triggerCharacters: ['a-z'] // 根据需要触发
      });
      ////
    }}/>
  )
}
