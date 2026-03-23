'use client'
import { useState } from "react";
import { useMyOrganizationBp } from "@/hooks/queries/use-bp-queries";
import MyPageTab01Data from "./tab01/MyPageTab01Data";
import MyPageTab01Edit from "./tab01/MyPageTab01Edit";

export default function MyPageTab01Layout() {
  const [editMode, setEditMode] = useState(false)
  const { data: bp, isPending } = useMyOrganizationBp()

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">데이터를 불러오는 중...</span>
      </div>
    )
  }

  if (!bp) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">사업자 정보를 찾을 수 없습니다.</span>
      </div>
    )
  }

  return (
    <>
      {editMode ?
        <MyPageTab01Edit key={bp.id} bp={bp} setEditMode={setEditMode} />
        : <MyPageTab01Data bp={bp} setEditMode={setEditMode} />
      }
    </>
  )
}
