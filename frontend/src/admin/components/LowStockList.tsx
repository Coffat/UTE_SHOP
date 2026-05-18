

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  threshold?: number;
}

export function LowStockList({ items }: { items: LowStockItem[] }) {
  return (
    <div className="admin-low-stock-list">
      {items.map((item) => (
        <div key={item.id} className="admin-low-stock-item">
          <div className="admin-low-stock-info">
            <div className="admin-low-stock-name">{item.name}</div>
            <div className="admin-low-stock-id">{item.id}</div>
          </div>
          <div className="admin-low-stock-status">
            <span className="admin-low-stock-count">{item.stock}</span>
            <span className="admin-low-stock-divider">/</span>
            <span className="admin-low-stock-threshold">{item.threshold}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
