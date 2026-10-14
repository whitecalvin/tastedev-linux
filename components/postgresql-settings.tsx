'use client';
import FileSettings, {type FileSettingsProps} from './file-settings';
export default function PostgreSQLSettings(props: Omit<FileSettingsProps,'format'>){return <FileSettings {...props} format="postgresql"/>;}
