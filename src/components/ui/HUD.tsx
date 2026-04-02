import ViewControls from './ViewControls'
import SearchBar from './SearchBar'
import RegionPanel from './RegionPanel'
import TaskSelector from './TaskSelector'

export default function HUD() {
  return (
    <>
      <SearchBar />
      <ViewControls />
      <TaskSelector />
      <RegionPanel />
    </>
  )
}
