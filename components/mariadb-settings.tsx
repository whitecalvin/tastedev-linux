'use client';
import FileSettings, {type FileSettingsProps} from './file-settings';
export default function MariaDBSettings(props: Omit<FileSettingsProps,'format'>){return <FileSettings {...props} format="mariadb"/>;}
