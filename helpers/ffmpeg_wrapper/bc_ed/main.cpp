#include <iostream>
extern "C" {
#include <llvm-c/Core.h>
#include <llvm-c/BitReader.h>
#include <llvm-c/BitWriter.h>

#include<string.h>

}
using namespace std;

int main(int argc, char** argv)
{

    if (5 > argc) {
      printf("Usage: <infile> <outfile> <function name to change> <rename>\n");
      return 1;
    }

    const char *const inputFilename = argv[1];
    const char *const outputFilename = argv[2];
    const char *const func_to_remove = argv[3];

    bool is_rename=(argc==5);
    const char *new_name;
    if(is_rename)
        new_name = argv[4];

    LLVMMemoryBufferRef memoryBuffer;
    char *message;
    if (0 != LLVMCreateMemoryBufferWithContentsOfFile(
               inputFilename, &memoryBuffer, &message)) {

        fprintf(stderr, "%s\n", message);
        free(message);
        return 1;
    }

    // now create our module using the memory buffer
    LLVMModuleRef module;
    if (0 != LLVMParseBitcode2(memoryBuffer, &module)) {
      fprintf(stderr, "Invalid bitcode detected!\n");
      LLVMDisposeMemoryBuffer(memoryBuffer);
      return 1;
    }

    // done with the memory buffer now, so dispose of it
    LLVMDisposeMemoryBuffer(memoryBuffer);

    /*LLVMValueRef function;
    while(function=LLVMGetFirstFunction(module)){
        LLVMDeleteFunction(function);
    }*/

    /*for (LLVMValueRef function = LLVMGetFirstFunction(module); function;
           function = LLVMGetNextFunction(function)) {

        const char* fname = LLVMGetValueName(function);
        printf("   func: %s\n",fname);
        if(strcmp(fname,func_to_remove)==0){
            printf("   func: %s\n",fname);
        }

    }*/
    if(is_rename){
        LLVMValueRef t;
        t = LLVMGetNamedFunction(module, func_to_remove);
        if(t){
            printf("func renaming: '%s' to '%s'\t| ",LLVMGetValueName(t), new_name);
            //LLVMDeleteFunction(t);
            LLVMSetValueName(t,new_name);
        }


        t = LLVMGetNamedGlobal(module, func_to_remove);
        if(t){
            printf("glob renaming: '%s' to '%s'\t| ",LLVMGetValueName(t), new_name);
            LLVMTypeRef type = LLVMTypeOf(t);
            //printf("  type: %s | ",	LLVMPrintTypeToString (type));
            LLVMSetValueName(t,new_name);
            //LLVMDeleteGlobal(t);
        }
    }



    if (0 != LLVMWriteBitcodeToFile(module, outputFilename)) {
        fprintf(stderr, "Failed to write bitcode to file!\n");
        LLVMDisposeModule(module);
        return 1;
    }

    printf("ok\n");

    return 0;
}
