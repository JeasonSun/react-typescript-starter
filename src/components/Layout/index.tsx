import React from 'react'
import './index.less'

export namespace Layout {
  export interface Props {
    child?: JSX.Element
  }
}

export const Layout = ({
  child
}: Layout.Props): JSX.Element => {
  return (
    <div className="layout">
      test-layout
    </div>
  )
}
