'use client'
import { useState } from "react";
import MyPageTab01Data from "./tab01/MyPageTab01Data";
import MyPageTab01Edit from "./tab01/MyPageTab01Edit";

export default function MyPageTab01Layout() {
  const [editMode, setEditMode] = useState(false)
  return (
    <>
      {editMode ? 
        <MyPageTab01Edit setEditMode={setEditMode} /> 
        : <MyPageTab01Data setEditMode={setEditMode} />
      }
    </>
  )
}