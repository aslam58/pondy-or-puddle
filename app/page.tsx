import {markup} from "./markup";
export default function Page(){return <><div dangerouslySetInnerHTML={{__html:markup}}/><script src="/dashboard.js" defer /></>}
