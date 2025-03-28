import ast
import json
from typing import Any, Dict, List, Union

def parse_python_source(source: str) -> Union[Dict[str, Any], str]:
    try:
        tree = ast.parse(source)
        exported_functions = extract_exported_functions(tree, source)
        return json.dumps({"functions": exported_functions}, indent=4)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=4)

def extract_exported_functions(tree: ast.Module, source: str) -> List[Dict[str, Any]]:
    exported = set()
    functions = []

    for node in tree.body:
        # Look for __all__ definition
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "__all__":
                    if isinstance(node.value, ast.List):
                        exported = {elt.s for elt in node.value.elts if isinstance(elt, ast.Str)}

    for node in tree.body:
        # Collect function definitions
        if isinstance(node, ast.FunctionDef):
            if node.name in exported:
                functions.append({
                    "name": node.name,
                    "parameters": extract_parameters(node),
                })

    return functions

def extract_parameters(node: ast.FunctionDef) -> List[str]:
    params = []
    for arg in node.args.args:
        if isinstance(arg, ast.arg):
            params.append(arg.arg)
    return params

if __name__ == "__main__":
    import sys
    try:
        if len(sys.argv) == 1:
            source_code = sys.stdin.read()
        else:
            source_code = open(sys.argv[1], 'r').read()
        print(parse_python_source(source_code))
    except Exception as e:
        print(json.dumps({"error": str(e)}, indent=4))
