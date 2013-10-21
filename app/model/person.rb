class Person < Lissio::Model
	adapter Lissio::Adapter::Storage

	property :name, primary: true

	def debts
		Payments.for(name, kind: :debt)
	end

	def credits
		Payments.for(name, kind: :credit)
	end
end
