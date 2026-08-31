import java.util.Scanner;

// ================================================================
// ABSTRACTION
// Soldier defines the contract every fighter must honor — a wage
// formula and a battle cry — without saying HOW. No object of
// type Soldier can ever exist directly.
// ================================================================
abstract class Soldier {

    // ENCAPSULATION: private fields, accessed only through
    // controlled methods — not even subclasses reach in directly.
    private String name;
    private int level;

    Soldier(String name, int level) {
        this.name = name;
        this.level = level;
    }

    protected String getName() { return name; }
    protected int getLevel() { return level; }

    abstract double calculateWage();
    abstract String battleCry();

    // Shared, concrete — inherited as-is by every subclass.
    void report() {
        System.out.printf("%-12s (Lvl %d) | Wage: %.2f gold | Cry: \"%s\"%n",
                getName(), getLevel(), calculateWage(), battleCry());
    }
}

// INHERITANCE (single-level)
class Knight extends Soldier {
    Knight(String name, int level) { super(name, level); }

    @Override double calculateWage() { return getLevel() * 15.0; }
    @Override String battleCry() { return "For the throne!"; }
}

class Archer extends Soldier {
    Archer(String name, int level) { super(name, level); }

    @Override double calculateWage() { return getLevel() * 10.0 + 5; }
    @Override String battleCry() { return "Loose!"; }
}

// MULTILEVEL INHERITANCE: EliteArcher -> Archer -> Soldier
class EliteArcher extends Archer {
    EliteArcher(String name, int level) { super(name, level); }

    @Override
    double calculateWage() {
        return super.calculateWage() * 1.5; // builds on the parent's formula, doesn't replace it
    }

    @Override String battleCry() { return "Not one shot missed!"; }
}

class Mage extends Soldier {
    Mage(String name, int level) { super(name, level); }

    @Override double calculateWage() { return getLevel() * 20.0; }
    @Override String battleCry() { return "By flame and fury!"; }
}

// COMPILE-TIME POLYMORPHISM (overloading)
class Recruiter {
    static Soldier recruit(String type, String name) {
        return recruit(type, name, 1);
    }

    static Soldier recruit(String type, String name, int level) {
        switch (type) {
            case "knight": return new Knight(name, level);
            case "archer": return new Archer(name, level);
            case "elitearcher": return new EliteArcher(name, level);
            case "mage": return new Mage(name, level);
            default: throw new IllegalArgumentException("Unknown soldier type: " + type);
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Soldier[] army = {
            Recruiter.recruit("knight", "Jorah", 5),
            Recruiter.recruit("archer", "Elyra"),
            Recruiter.recruit("elitearcher", "Sylas", 4),
            Recruiter.recruit("mage", "Voss", 3)
        };

        System.out.println("--- Muster roll (runtime polymorphism) ---");
        double totalPayroll = 0;
        for (Soldier s : army) {
            s.report(); // dynamic dispatch resolves calculateWage()/battleCry() per real object
            totalPayroll += s.calculateWage();
        }
        System.out.printf("%nTotal payroll: %.2f gold%n", totalPayroll);

        System.out.println("\n--- Underlying types survive the abstraction ---");
        for (Soldier s : army) {
            System.out.println(s.getName() + " instanceof EliteArcher? " + (s instanceof EliteArcher));
        }

        // Soldier bare = new Soldier("Nobody", 1);  // would NOT compile
    }
}
