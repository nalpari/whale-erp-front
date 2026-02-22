'use client'

import { useState } from 'react'
import Location from '@/components/ui/Location'
import CommonCodeSearch from '@/components/system/common-code/CommonCodeSearch'
import CommonCodeList from '@/components/system/common-code/CommonCodeList'
import { useCommonCodeTree, type CommonCodeNode } from '@/hooks/queries/use-common-code-queries'
import type { CommonCodeSearchParams } from '@/lib/schemas/common-code'

function countNodes(nodes: CommonCodeNode[]): number {
    let count = 0
    for (const node of nodes) {
        count += 1
        if (node.children?.length) {
            count += countNodes(node.children)
        }
    }
    return count
}

const initialParams: CommonCodeSearchParams = {
    ownerGroup: 'platform',
}

export default function CommonCodesPage() {
    const [searchParams, setSearchParams] = useState<CommonCodeSearchParams>(initialParams)

    const { data: treeData = [] } = useCommonCodeTree(
        searchParams.ownerGroup,
        3,
        searchParams.headOfficeId?.toString(),
        searchParams.franchiseeId?.toString(),
        searchParams.isActive,
        searchParams.headerCode,
        searchParams.headerId,
        searchParams.headerName,
        searchParams.headerDescription
    )
    const totalNodeCount = countNodes(treeData)

    const handleSearch = (params: CommonCodeSearchParams) => {
        setSearchParams(params)
    }

    return (
        <div className="data-wrap">
            <Location title="공통 코드 관리" list={['시스템 관리', '공통 코드 관리']} />
            <CommonCodeSearch
                params={searchParams}
                onSearch={handleSearch}
                resultCount={totalNodeCount}
            />
            <CommonCodeList
                codeGroup={searchParams.ownerGroup}
                headOffice={searchParams.headOfficeId?.toString()}
                franchise={searchParams.franchiseeId?.toString()}
                isActive={searchParams.isActive}
                headerCode={searchParams.headerCode}
                headerId={searchParams.headerId}
                headerName={searchParams.headerName}
                headerDescription={searchParams.headerDescription}
            />
        </div>
    )
}
