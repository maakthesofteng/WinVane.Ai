import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName?: string): string {
    return customName ? customName : this.toSnakeCase(className);
  }

  columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes: string[] = [],
  ): string {
    const formattedPrefixes = embeddedPrefixes.map((p) => this.toSnakeCase(p));
    const formattedProperty = customName
      ? customName
      : this.toSnakeCase(propertyName);

    return [...formattedPrefixes, formattedProperty].join('_');
  }

  relationName(propertyName: string): string {
    return this.toSnakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.toSnakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    _secondPropertyName: string,
  ): string {
    return this.toSnakeCase(
      `${firstTableName}_${firstPropertyName.replace(/\./gi, '_')}_${secondTableName}`,
    );
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return this.toSnakeCase(`${tableName}_${columnName ?? propertyName}`);
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return this.toSnakeCase(`${parentTableName}_${parentTableIdPropertyName}`);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/(?:^|\.?)([A-Z])/g, (_, y) => `_${(y as string).toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[- ]+/g, '_')
      .toLowerCase();
  }
}
