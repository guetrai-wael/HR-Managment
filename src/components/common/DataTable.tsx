import { Table, Empty } from "antd";
import { TableProps } from "antd/es/table";

interface DataTableProps<T extends object> extends TableProps<T> {
  dataSource: T[];
  columns: TableProps<T>["columns"];
  loading?: boolean;
  pagination?: TableProps<T>["pagination"] | false;
  rowKey?: keyof T | ((record: T) => string);
  emptyTextDescription?: string;
  tableClassName?: string;
  containerClassName?: string;
}

const DataTable = <T extends object>({
  dataSource,
  columns,
  loading = false,
  pagination,
  rowKey = "id" as keyof T, // Default rowKey to 'id', common in many models
  emptyTextDescription = "No data found",
  tableClassName = "",
  containerClassName = "datatable-wrapper overflow-hidden",
  scroll = { x: "max-content" }, // Default scroll behavior
  ...restTableProps
}: DataTableProps<T>) => {
  const defaultPaginationConfig: TableProps<T>["pagination"] = {
    pageSize: 10,
    showSizeChanger: false,
    hideOnSinglePage: dataSource.length <= 10,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    responsive: true,
  };

  const mergedPagination =
    pagination === false
      ? false
      : { ...defaultPaginationConfig, ...pagination };

  return (
    <div className={containerClassName}>
      <Table<T>
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
        pagination={mergedPagination}
        className={`custom-datatable ${tableClassName}`}
        scroll={scroll}
        locale={{
          emptyText: (
            <Empty
              description={emptyTextDescription}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        {...restTableProps}
      />
    </div>
  );
};

export default DataTable;
