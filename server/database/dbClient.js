// In-memory database client for testing purposes.
// Provides a simplified interface for database operations using an in-memory Map.

class InMemoryDB {
    constructor() {
      this.tables = new Map(); 
    }
  
    #table(name) {
      if (!this.tables.has(name)) this.tables.set(name, []);
      return this.tables.get(name);
    }
  
    async insert(table, row) {
      this.#table(table).push(row);
      return row;
    }
  
    async select(table, query) {
      return this.#table(table).filter(r =>
        Object.entries(query).every(([k, v]) => r[k] === v)
      );
    }
  
    async update(table, query, updates) {
      const rows = this.#table(table);
      let updatedRow = null;
      for (const r of rows) {
        if (Object.entries(query).every(([k, v]) => r[k] === v)) {
          Object.assign(r, updates);
          updatedRow = r;
          break;
        }
      }
      return updatedRow;
    }
  }
  
  export default new InMemoryDB();
  