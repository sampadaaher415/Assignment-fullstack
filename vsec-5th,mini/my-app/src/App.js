
import './App.css';
import Comp from './Comp';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  function increase() {
    setCount(count + 1);
  }

  return (
    <div className="App">
      <h1>My React App</h1>

      <h2>Count: {count}</h2>

      <button onClick={increase}>
        Increase
      </button>

      <Comp />
    </div>
  );
}

export default App;
