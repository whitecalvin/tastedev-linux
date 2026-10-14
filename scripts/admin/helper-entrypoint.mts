declare const main:typeof import('./helper-lock-main.mts').main;
declare const helperErrorOutput:typeof import('./helper-error-output.mts').helperErrorOutput;
main().catch((error:unknown)=>{
 process.stderr.write(helperErrorOutput(error,process.argv[2]));
 process.exitCode=1;
});
