import re
import os

input_file = r'C:\Users\jeanc\Documents\esudelib_db_plaint_text.sql'
output_file = r'C:\Users\jeanc\Documents\esudelib_db_mysql_ready.sql'

def convert_pg_to_mysql():
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found")
        return

    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f, \
         open(output_file, 'w', encoding='utf-8') as out:
        
        # Disable FK checks at the beginning
        out.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
        
        in_copy_block = False
        table_name = ''
        columns = ''
        truncated_tables = set()
        
        for line in f:
            # Detect COPY start
            copy_match = re.match(r'COPY (?:public\.)?(\w+) \((.*)\) FROM stdin;', line)
            if copy_match:
                in_copy_block = True
                table_name = copy_match.group(1)
                columns = copy_match.group(2)
                
                # Truncate table once before inserting data to avoid duplicates
                if table_name not in truncated_tables:
                    out.write(f"TRUNCATE TABLE {table_name};\n")
                    truncated_tables.add(table_name)
                continue
            
            # Detect COPY end
            if line.strip() == r'\.':
                in_copy_block = False
                continue
            
            if in_copy_block:
                vals = line.strip('\n').split('\t')
                formatted_vals = []
                for v in vals:
                    if v == r'\N':
                        formatted_vals.append('NULL')
                    elif v == 't':
                        formatted_vals.append('1')
                    elif v == 'f':
                        formatted_vals.append('0')
                    else:
                        # Escape single quotes properly for MySQL
                        escaped = v.replace("'", "''")
                        formatted_vals.append(f"'{escaped}'")
                
                if len(formatted_vals) > 0:
                    out.write(f"INSERT INTO {table_name} ({columns}) VALUES ({', '.join(formatted_vals)});\n")
            else:
                # Skip PG-specific lines
                if line.startswith(('SET ', 'SELECT pg_catalog', 'START TRANSACTION', 'COMMIT', '--')):
                    continue
                if line.strip():
                    l = line.replace('public.', '').replace('timestamp(0) without time zone', 'DATETIME')
                    out.write(l)

        # Re-enable FK checks at the end
        out.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")

if __name__ == "__main__":
    convert_pg_to_mysql()
    print(f"Conversion terminée avec TRUNCATE et FK_CHECKS : {output_file}")
