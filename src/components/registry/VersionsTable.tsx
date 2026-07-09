import React from 'react';
import { SmartTable } from './SmartTable';
import type { SmartTableColumn } from './SmartTable';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface VersionItem {
  version: string;
  date: string;
  notes: string;
  filesCount?: number;
  sizeKb?: number;
  approvalStatus?: 'approved' | 'pending' | 'rejected' | string;
  content?: string;
}

interface VersionsTableProps {
  versions: VersionItem[];
  currentVersion: string;
  compareEnabled?: boolean;
  selectedVersions?: string[];
  onSelectVersion?: (version: string) => void;
  hideFilesAndSize?: boolean;
  onDownload?: (versionItem: VersionItem) => void;
}

export const VersionsTable: React.FC<VersionsTableProps> = ({
  versions,
  currentVersion,
  compareEnabled = false,
  selectedVersions = [],
  onSelectVersion,
  hideFilesAndSize = false,
  onDownload
}) => {

  const handleCheckboxChange = (version: string) => {
    if (onSelectVersion) {
      onSelectVersion(version);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = React.useMemo(() => {
    const cols: SmartTableColumn<VersionItem>[] = [];

    // Checkbox column for comparison
    if (compareEnabled && onSelectVersion) {
      cols.push({
        key: 'compare',
        header: <span className="text-[10px]">Compare</span>,
        className: 'w-[80px] text-center',
        render: (row) => {
          const isChecked = selectedVersions.includes(row.version);
          const isDisabled = !isChecked && selectedVersions.length >= 2;
          return (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => handleCheckboxChange(row.version)}
                className="size-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          );
        }
      });
    }

    // Version column
    cols.push({
      key: 'version',
      header: 'Version',
      className: 'font-mono font-bold w-[120px]',
      render: (row) => {
        const isActive = row.version === currentVersion;
        return (
          <div className="flex items-center gap-2 select-all">
            <span>v{row.version}</span>
            {isActive && (
              <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0 px-1 leading-none">
                Active
              </Badge>
            )}
          </div>
        );
      }
    });

    // Notes/Release info
    cols.push({
      key: 'notes',
      header: 'Release Notes',
      render: (row) => <span className="text-[13px] text-foreground/80">{row.notes}</span>
    });

    if (!hideFilesAndSize) {
      cols.push({
        key: 'files',
        header: 'Files',
        className: 'w-[100px] text-center font-mono',
        render: (row) => <span>{row.filesCount ?? 1} files</span>
      });

      cols.push({
        key: 'size',
        header: 'Size',
        className: 'w-[100px] text-center font-mono',
        render: (row) => <span>{((row.sizeKb ?? 1.2)).toFixed(1)} KB</span>
      });
    }

    // Approval status badge
    cols.push({
      key: 'approvalStatus',
      header: 'Approval',
      className: 'w-[120px] text-center',
      render: (row) => {
        const status = (row.approvalStatus || 'approved').toLowerCase();
        let colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        if (status === 'pending') {
          colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        } else if (status === 'rejected') {
          colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
        }
        return (
          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colorClass}`}>
            {status}
          </span>
        );
      }
    });

    // Published Date
    cols.push({
      key: 'date',
      header: 'Published',
      className: 'w-[130px] font-mono text-right',
      render: (row) => <span>{formatDate(row.date)}</span>
    });

    // Download action
    cols.push({
      key: 'download',
      header: 'Action',
      className: 'w-[100px] text-center select-none',
      render: (row) => (
        <button
          onClick={() => {
            if (onDownload) {
              onDownload(row);
            } else {
              toast.success(`Simulating download of version v${row.version}`);
            }
          }}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Download version"
        >
          <Download className="size-4" />
        </button>
      )
    });

    return cols;
  }, [compareEnabled, selectedVersions, currentVersion, hideFilesAndSize, onDownload]);

  return (
    <SmartTable
      columns={columns}
      rows={versions}
      searchKeys={['version', 'notes']}
      searchPlaceholder="Search versions..."
    />
  );
};
