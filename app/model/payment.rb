class Payment < Lissio::Model
	adapter Lissio::Adapter::Storage do
		autoincrement :id
	end

	property :id, as: Integer, primary: true
	property :recipient, as: Person
	property :for, as: String
	property :at, as: Time, default: -> { Time.now }
	property :amount, as: Float
	property :sign, as: Symbol
	property :satisfied, as: Boolean, default: false

	alias satisfied? satisfied
end
