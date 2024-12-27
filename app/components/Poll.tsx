"use client"
import React from "react";
import { useState } from "react";
function Poll() {

  const [createOption , setCreateOption ] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [item , setItem] = useState('')
  const [showList , setShowList] = useState(false)
  const [pollInfo , setPollInfo] = useState({
    pollTopic : "" ,
    pollDescription : ""
  })

  const handleClick = ()=> {

    setCreateOption(!createOption) 
    setShowList(false)
    if (item && !options.includes(item)) {
      setOptions((prevItems) => [...prevItems, item]); // Add the item to the list
      setItem(""); // Clear the input after adding
      setShowList(true) 
      setCreateOption(true)
    }
  }; 

const  handleInputChange = (e) => {
  setItem(e.target.value)
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget);
  setPollInfo({
    pollTopic : formData.get('pollTopic' ) as string || '', //add the info from the form
    pollDescription : formData.get('pollDescription' ) as string 
  })
}

  
  return (
    <div >

 <form onSubmit={handleSubmit} className="w-64 h-full text-white  flex-col items-center justify-center rounded-lg shadow-lg p-4">
  
<div>
<input type="text" placeholder="Title" className="input input-bordered input-secondary h-8 w-66 max-w-xs text-black mb-2" />
<input type="text" placeholder="Discription" className="input input-bordered input-secondary h-10 w-66 max-w-xs text-black" />
</div>



<div className="flex items-center"> 
<div className=" mt-2 mb-2 text-black font-bold"> Create an option </div>  <button onClick={handleClick}className="btn btn-xs"> + </button>
</div>
{showList && (<div className="text-black mt-0">
  <ol>
    {options.map((option , index) => (
      <label key={index} className="flex items-center">
        <input
        key={index}
          type="radio"
          name="options"  // Group all radio buttons under the same name
          value={option}
       // Handle the change event for selecting an option
          className="mr-2"
        />
        {option}
      </label>
    ))}
  </ol>
</div>)}

{createOption && ( <div className="flex items-center">
  
  <input type="text" value={item} onChange={handleInputChange} placeholder="Type here" className="input input-bordered w-70 h-6 max-w-xs text-black" /> <button onClick={handleClick}className="btn btn-xs"> + </button> </div>)}
  <div className="flex justify-center w-full mt-4">
    <button className="btn btn-active w-full max-w-xs">Submit</button>
  </div>
</form>
      
    </div>
  );
}

export default Poll;
