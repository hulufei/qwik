import { getSystem, loadPlatformBinding, PlatformBinding } from './platform';
import type {
  TransformModulesOptions,
  TransformFsOptions,
  Optimizer,
  OptimizerSystem,
} from './types';

/**
 * @alpha
 */
export const createOptimizer = async () => {
  const sys = await getSystem();
  const binding = await loadPlatformBinding(sys);

  const optimizer: Optimizer = {
    async transformModules(opts: TransformModulesOptions) {
      return transformModulesSync(binding, opts);
    },
    transformModulesSync(opts: TransformModulesOptions) {
      return transformModulesSync(binding, opts);
    },
    async transformFs(opts: TransformFsOptions) {
      return transformFsAsync(sys, binding, opts);
    },
    transformFsSync(opts: TransformFsOptions) {
      return transformFsSync(sys, binding, opts);
    },
    sys,
  };

  return optimizer;
};

/**
 * Transforms the input code string, does not access the file system.
 */
const transformModulesSync = (binding: PlatformBinding, opts: TransformModulesOptions) => {
  return binding.transform_modules(convertOptions(opts));
};

const transformFsSync = (
  sys: OptimizerSystem,
  binding: PlatformBinding,
  opts: TransformFsOptions
) => {
  if (binding.transform_fs) {
    return binding.transform_fs(convertOptions(opts));
  }
  throw new Error('Not implemented');
};

const transformFsAsync = async (
  sys: OptimizerSystem,
  binding: PlatformBinding,
  fsOpts: TransformFsOptions
) => {
  if (binding.transform_fs && !sys.getInputFiles) {
    return binding.transform_fs(convertOptions(fsOpts));
  }

  if (sys.getInputFiles) {
    const input = await sys.getInputFiles(fsOpts.rootDir);

    const modulesOpts: TransformModulesOptions = {
      rootDir: fsOpts.rootDir,
      entryStrategy: fsOpts.entryStrategy,
      minify: fsOpts.minify,
      sourceMaps: fsOpts.sourceMaps,
      transpile: fsOpts.transpile,
      input,
    };

    return binding.transform_modules(convertOptions(modulesOpts));
  }

  throw new Error('Not implemented');
};

const convertOptions = (opts: any) => {
  const output: any = {
    minify: 'simplify',
    sourceMaps: false,
    transpile: false,
    explicityExtensions: false,
  };
  Object.entries(opts).forEach(([key, value]) => {
    if (value != null) {
      output[key] = value;
    }
  });
  output.entryStrategy = opts.entryStrategy?.type ?? 'smart';
  return output;
};
