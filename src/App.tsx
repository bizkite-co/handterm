import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React from 'react'

export default function App() {

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <IncrementButton />
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Parent />
    </>
  )
}

function Parent() {
  return <Child />;
}

function IncrementButton() {
  const [count, setCount] = React.useState(0);
  return (
    <button 
      onClick={() => setCount((count) => count + 1)}>
      count is {count}
    </button>
  )
}

export function Child() {
  let modeName: String = "child test";
  let inputRef = React.useRef<HTMLInputElement>(null);

  function onInputHandler(): void {
    console.log("App.tsx: ", inputRef.current?.value);
  }

  return (
    <div>
      <label htmlFor="testMode">{modeName}</label>
      <input
        ref={inputRef}
        onInput={onInputHandler} />
    </div>
  )
}
