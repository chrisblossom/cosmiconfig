import cosmiconfig from '../src';
import { absolutePath } from './util';

describe('loads defined JSON config path', () => {
  const file = absolutePath('fixtures/foo.json');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads defined YAML config path', () => {
  const file = absolutePath('fixtures/foo.yaml');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads defined JS config path', () => {
  const file = absolutePath('fixtures/foo.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads modularized JS config path', () => {
  const file = absolutePath('fixtures/foo-module.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('loads yaml-like JS config path', () => {
  const file = absolutePath('fixtures/foo-yaml-like.js');
  const checkResult = result => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', () => {
    return cosmiconfig()
      .load(file)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig().loadSync(file);
    checkResult(result);
  });
});

describe('respects options.configPath', () => {
  const configPath = absolutePath('fixtures/foo.json');
  const checkResult = result => {
    expect(result.config).toEqual({
      foo: true,
    });
    expect(result.filepath).toBe(configPath);
  };

  test('async', () => {
    return cosmiconfig('foo', { configPath })
      .load()
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', { configPath }).loadSync();
    checkResult(result);
  });
});

describe('loads package prop when configPath is package.json', () => {
  const configPath = absolutePath('fixtures/package.json');
  const checkResult = result => {
    expect(result.config).toEqual({
      bar: 'baz',
    });
    expect(result.filepath).toBe(configPath);
  };

  test('async', () => {
    return cosmiconfig('foo', { configPath })
      .load()
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig('foo', { configPath }).loadSync();
    checkResult(result);
  });
});

describe('runs transform', () => {
  const configPath = absolutePath('fixtures/foo.json');
  const transform = result => {
    result.config.foo = [result.config.foo];
    return result;
  };
  const checkResult = result => {
    expect(result.config).toEqual({ foo: [true] });
  };

  test('async', () => {
    return cosmiconfig(null, { transform })
      .load(configPath)
      .then(checkResult);
  });

  test('sync', () => {
    const result = cosmiconfig(null, { transform }).loadSync(configPath);
    checkResult(result);
  });
});

describe('does not swallow transform errors', () => {
  const configPath = absolutePath('fixtures/foo.json');
  const transform = () => {
    throw new Error('These pretzels are making me thirsty!');
  };

  const checkError = error => {
    expect(error.message).toBe('These pretzels are making me thirsty!');
  };

  test('async', () => {
    expect.hasAssertions();
    return cosmiconfig(null, { transform })
      .load(configPath)
      .catch(checkError);
  });

  test('sync', () => {
    expect.hasAssertions();
    try {
      cosmiconfig(null, { transform }).loadSync(configPath);
    } catch (error) {
      checkError(error);
    }
  });
});
