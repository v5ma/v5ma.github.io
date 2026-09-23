// Presentation only. The selected task still comes from the real mission director.
export function storyFocus(task){return typeof task?.name==='string'&&task.name.startsWith('First Light / ');}
// Suppress only unrelated dispatch copy and on-foot mounted-tool advertising.
// Keep map, HERE, equipment/ammunition, tool buttons, journal and all activities.
export const STORY_FOCUS_STYLE='body[data-living-focus="true"] #ranch-status,body[data-living-focus="true"][data-mode="foot"] #field-utility-status{display:none!important}';
