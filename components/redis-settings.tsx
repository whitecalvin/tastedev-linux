'use client';
import FileSettings, {type FileSettingsProps} from './file-settings';
export default function RedisSettings(props: Omit<FileSettingsProps,'format'>){return <FileSettings {...props} format="redis"/>;}
