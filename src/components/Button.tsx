type ButtonProps = {
  title: string,
  onClick: () => void,
}

export default function Button(props: ButtonProps) {
  return (
    <button
      class='px-2 py-2 mb-1 bg-white text-slate-600 border-1 border-slate-400 w-full\
      hover:bg-slate-100 cursor-pointer transition-all'
      on:click={props.onClick}
    >
      {props.title}
    </button>
  )
}