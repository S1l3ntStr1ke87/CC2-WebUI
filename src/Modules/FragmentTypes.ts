export class Fragment {
    constructor() {}
}

export class FragmentInstance {
    public readonly name: string;
    public readonly instance: Fragment;
    
    constructor(name: string, instance: Fragment) {
        this.name = name;
        this.instance = instance;
    }
}

